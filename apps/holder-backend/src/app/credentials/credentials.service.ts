import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Or,
  Repository,
} from 'typeorm';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { Credential, CredentialStatus } from './entities/credential.entity';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-nodejs';
import { CredentialResponse } from './dto/credential-response.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_DELETED_EVENT, UserDeletedEvent } from '../auth/auth.service';
import { Interval } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Verifier } from '@sd-jwt/types';
import { JWK, JWTPayload } from '@sphereon/oid4vci-common';
import { CryptoService, ResolverService } from '@credhub/backend';

type DateKey = 'exp' | 'nbf';
@Injectable()
export class CredentialsService {
  instance: SDJwtVcInstance;

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private httpService: HttpService,
    private resolverService: ResolverService,
    private cryptoService: CryptoService
  ) {
    const verifier: Verifier = async (data, signature) => {
      const decodedVC = await this.instance.decode(`${data}.${signature}`);
      const payload = decodedVC.jwt?.payload as JWTPayload;
      const header = decodedVC.jwt?.header as JWK;
      const publicKey = await this.resolverService.resolvePublicKey(
        payload,
        header
      );
      //get the verifier based on the algorithm
      const crypto = this.cryptoService.getCrypto(header.alg);
      const verify = await crypto.getVerifier(publicKey);
      return verify(data, signature).catch((err) => {
        console.log(err);
        return false;
      });
    };

    /**
     * Fetch the status list from the uri.
     * @param uri
     * @returns
     */
    const statusListFetcher: (uri: string) => Promise<string> = async (
      uri: string
    ) => {
      const response = await firstValueFrom(this.httpService.get(uri));
      return response.data;
    };

    this.instance = new SDJwtVcInstance({
      hasher: digest,
      statusListFetcher,
      statusValidator(status) {
        if (status === 1) {
          throw new Error('Status is not valid');
        }
        return Promise.resolve();
      },
      verifier,
    });
  }

  /**
   * Start an interval to update the status of the credentials. This is relevant for showing active credentials.
   */
  @Interval(1000 * 3)
  updateStatusInterval() {
    this.updateStatus();
  }

  async create(createCredentialDto: CreateCredentialDto, user: string) {
    const credential = this.credentialRepository.create({
      ...createCredentialDto,
      user,
      id: this.getCredentialId(createCredentialDto.value),
      nbf: await this.getDate(createCredentialDto.value, 'nbf'),
      exp: await this.getDate(createCredentialDto.value, 'exp'),
    });
    await this.credentialRepository.save(credential);
    return {
      id: credential.id,
    };
  }

  /**
   * Create the id of the credential based on the hash of the value.
   * @param value
   * @returns
   */
  getCredentialId(value: string): string {
    //just use the first part since not all credentials have the disclosed values.
    return createHash('sha256').update(value.split('~')[0]).digest('hex');
  }

  /**
   * Get the date from the credential, use key to get the correct value.
   * @param credential
   * @param key
   */
  private getDate(credential: string, key: DateKey) {
    return this.instance
      .decode(credential)
      .then((vc) =>
        vc.jwt.payload[key] ? (vc.jwt.payload[key] as number) * 1000 : undefined
      );
  }

  /**
   * Find all credentials of a user. In case archive is set, return the revoked or expired credentials.
   * @param user
   * @param archive
   * @returns
   */
  findAll(user: string, archive?: boolean) {
    const date = Date.now();

    if (!archive) {
      return this.credentialRepository.find({
        where: {
          user,
          status: IsNull(),
          exp: Or(IsNull(), MoreThanOrEqual(date)),
          nbf: Or(IsNull(), LessThanOrEqual(date)),
        },
      });
    }
    if (archive) {
      return this.credentialRepository.find({
        where: {
          user,
          status: Not(IsNull()),
          exp: Or(IsNull(), LessThanOrEqual(date)),
          nbf: Or(IsNull(), MoreThanOrEqual(date)),
        },
      });
    }
    //TODO: when to show the credentials that are not active yet?
  }

  findOne(id: string, user: string) {
    return this.credentialRepository.findOneOrFail({ where: { id, user } });
  }

  showOne(id: string, user: string): Promise<CredentialResponse> {
    return this.findOne(id, user).then(async (entry) => {
      const sdjwtvc = await this.instance.decode(entry.value);
      const claims = await sdjwtvc.getClaims<Record<string, unknown>>(digest);
      entry.user = undefined;
      return {
        ...entry,
        credential: claims,
      };
    });
  }

  remove(id: string, user: string) {
    return this.credentialRepository.delete({ id, user });
  }

  /**
   * Updates the state of a credential. This is relevant for showing active credentials.
   */
  async updateStatus() {
    //we are going for all credentials where credentials are not expired. It could happen that the status of a revoked credential will change.
    const credentials = await this.credentialRepository.find({
      where: {
        //exp: MoreThanOrEqual(Date.now() / 1000),
        //only a valid credential has an empty status.
        status: IsNull(),
      },
    });
    for (const credential of credentials) {
      await this.instance.verify(credential.value).then(
        async () => {
          // only update it if it was revoked before. Otherwhise we do not need to update the entry.
          if (credential.status === CredentialStatus.REVOKED) {
            credential.status = undefined;
            await this.credentialRepository.save(credential);
          }
        },
        async (err: Error) => {
          console.log(err);
          if (err.message.includes('Status is not valid')) {
            //update the status in the db.
            credential.status = CredentialStatus.REVOKED;
            await this.credentialRepository.save(credential);
          }
        }
      );
    }
  }

  /**
   * Handle the user deleted event. This will remove all credentials of a user.
   * @param payload
   */
  @OnEvent(USER_DELETED_EVENT)
  handleUserDeletedEvent(payload: UserDeletedEvent) {
    this.credentialRepository.delete({ user: payload.id });
  }
}
