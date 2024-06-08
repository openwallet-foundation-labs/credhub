import {
  type ECKeyPairOptions,
  type JsonWebKey,
  generateKeyPairSync,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SdJwtKbJwtInput } from '@sphereon/pex/dist/main/lib';
import {
  type JWTHeaderParameters,
  type JWTPayload,
  type KeyLike as JoseKeyLike,
  SignJWT,
  importJWK,
} from 'jose';
import { Repository } from 'typeorm';
import { CreateKey } from './dto/create-key.dto';
import { KeyResponse } from './dto/key-response.dto';
import { ProofRequest } from './dto/proof-request.dto';
import { SignRequest } from './dto/sign-request.dto';
import { Key } from './entities/key.entity';
import { KeysService } from './keys.service';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_DELETED_EVENT, UserDeletedEvent } from '../auth/auth.service';

@Injectable()
export class DbKeysService extends KeysService {
  constructor(@InjectRepository(Key) private keyRepository: Repository<Key>) {
    super();
  }

  async create(createKeyDto: CreateKey, user: string): Promise<KeyResponse> {
    const curves = {
      ES256: 'P-256',
      ES384: 'P-384',
      ES512: 'P-521',
    };
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: curves[createKeyDto.type],
      publicKeyEncoding: {
        type: 'spki',
        format: 'jwk',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'jwk',
      },
    } as ECKeyPairOptions<'jwk', 'jwk'>);

    const key = new Key();
    key.user = user;
    key.privateKey = privateKey as unknown as JsonWebKey;
    key.publicKey = publicKey as unknown as JsonWebKey;
    const entity = await this.keyRepository.save(key);
    return {
      id: entity.id,
      publicKey: publicKey as unknown as JsonWebKey,
    };
  }

  firstOrCreate(user: string) {
    return this.keyRepository.findOne({ where: { user } }).then((key) => {
      if (!key) {
        return this.create({ type: 'ES256' }, user);
      }
      return key;
    });
  }

  sign(id: string, user: string, value: SignRequest) {
    return this.keyRepository
      .findOneOrFail({ where: { id, user } })
      .then(async (key) => {
        const jwk = await importJWK(key.privateKey, 'ES256');
        const header = JSON.parse(
          this.decodeBase64Url(value.data.split('.')[0])
        ) as JWTHeaderParameters;
        const payload = JSON.parse(
          this.decodeBase64Url(value.data.split('.')[1])
        ) as JWTPayload;
        const jwt = await new SignJWT(payload)
          .setProtectedHeader(header)
          .sign(jwk);
        return jwt.split('.')[2];
      });
  }

  async proof(user: string, value: ProofRequest) {
    return this.keyRepository
      .findOneOrFail({
        where: { id: value.kid, user },
      })
      .then(async (key) => {
        //TODO: add the key id when the key is interset into the database. For this the primary get has to be generated first
        key.publicKey.kid = key.id;

        const jwk = await importJWK<JoseKeyLike>(key.privateKey, 'ES256');
        return new SignJWT({ ...value.payload })
          .setProtectedHeader({
            alg: 'ES256',
            typ: 'openid4vci-proof+jwt',
            jwk: key.publicKey,
          })
          .setIssuedAt()
          .setExpirationTime('2h')
          .sign(jwk);
      });
  }

  public async signkbJwt(
    user: string,
    kid: string,
    kbJwt: SdJwtKbJwtInput,
    aud: string
  ) {
    const key = await this.keyRepository.findOneOrFail({
      where: { id: kid, user },
    });
    const jwk = await importJWK<JoseKeyLike>(key.privateKey, 'ES256');
    return new SignJWT({ ...kbJwt.payload, aud })
      .setProtectedHeader({ typ: kbJwt.header.typ, alg: 'ES256' })
      .sign(jwk);
  }

  /**
   * Handle the user deleted event. This will remove all keys of a user.
   * @param payload
   */
  @OnEvent(USER_DELETED_EVENT)
  handleUserDeletedEvent(payload: UserDeletedEvent) {
    this.keyRepository.delete({ user: payload.id });
  }
}
