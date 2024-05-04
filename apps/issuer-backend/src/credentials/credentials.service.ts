import { Injectable } from '@nestjs/common';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from './entities/credential.entity';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>
  ) {}

  create(createCredentialDto: CreateCredentialDto) {
    const credential = this.credentialRepository.create(createCredentialDto);
    return this.credentialRepository.save(credential);
  }

  findAll() {
    return this.credentialRepository.find();
  }

  findOne(id: string) {
    return this.credentialRepository.findOneOrFail({ where: { id } });
  }

  remove(id: string) {
    return this.credentialRepository.delete(id);
  }
}
