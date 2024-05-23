import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { Credential } from './entities/credential.entity';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-nodejs';
import { CredentialResponse } from './dto/credential-response.dto';

@Injectable()
export class CredentialsService {
  instance: SDJwtVcInstance;

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>
  ) {
    this.instance = new SDJwtVcInstance({
      hasher: digest,
      verifier: () => Promise.resolve(true),
    });
    this.updateStatus();
  }

  async create(createCredentialDto: CreateCredentialDto, user: string) {
    const credential = new Credential();
    credential.id = createCredentialDto.id;
    credential.user = user;
    credential.value = createCredentialDto.value;
    credential.metaData = createCredentialDto.metaData;
    credential.issuer = createCredentialDto.issuer;
    credential.exp = await this.getExp(createCredentialDto.value);
    await this.credentialRepository.save(credential);
    return {
      id: credential.id,
    };
  }

  private getExp(credential: string) {
    return this.instance
      .decode(credential)
      .then((vc) =>
        vc.jwt.payload.exp
          ? new Date((vc.jwt.payload.exp as number) * 1000)
          : undefined
      );
  }

  findAll(user: string) {
    return this.credentialRepository.find({ where: { user } });
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

  async updateStatus() {
    const credentials = await this.credentialRepository.find();
    for (const credential of credentials) {
      await this.instance.verify(credential.value).catch(async (err: Error) => {
        if (err.message.includes('Status is not valid')) {
          //update the status in the db.
          credential.status = 'revoked';
          await this.credentialRepository.save(credential);
        }
      });
    }
  }
}
