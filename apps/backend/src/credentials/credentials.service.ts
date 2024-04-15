import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { Credential } from './entities/credential.entity';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>
  ) {}

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

  remove(id: string, user: string) {
    return this.credentialRepository.delete({ id, user });
  }
}
