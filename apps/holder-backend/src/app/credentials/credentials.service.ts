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
    this.instance = new SDJwtVcInstance({ hasher: digest });
  }

  async create(createCredentialDto: CreateCredentialDto, user: string) {
    const credential = new Credential();
    credential.id = createCredentialDto.id;
    credential.user = user;
    credential.value = createCredentialDto.value;
    credential.metaData = createCredentialDto.metaData;
    credential.issuer = createCredentialDto.issuer;
    await this.credentialRepository.save(credential);
    return {
      id: credential.id,
    };
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
      claims.status = undefined;
      entry.value = undefined;
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
}
