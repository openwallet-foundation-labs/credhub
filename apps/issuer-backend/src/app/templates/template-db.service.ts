import { ConflictException, Injectable } from '@nestjs/common';
import { TemplatesService } from './templates.interface';
import { Template } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template as TemplateEntity } from './schemas/temoplate.entity';
import { Repository } from 'typeorm';
import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';
import { CredentialSchema } from '../issuer/types';

@Injectable()
export class TemplatesDBService extends TemplatesService {
  getMetadata(): Promise<CredentialIssuerMetadataOptsV1_0_13> {
    throw new Error('Method not implemented.');
  }
  setMetadata(metadata: CredentialIssuerMetadataOptsV1_0_13): Promise<void> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(TemplateEntity)
    private templateRepository: Repository<TemplateEntity>
  ) {
    super();
  }

  async listAll() {
    const rec: Map<string, CredentialSchema> = new Map();
    const elements = await this.templateRepository.find();
    elements.forEach((element) => rec.set(element.id, element.value));
    return rec;
  }

  async getOne(id: string) {
    return this.templateRepository
      .findOneByOrFail({ id })
      .then((res) => res.value);
  }

  async create(data: Template) {
    await this.templateRepository
      .save(
        this.templateRepository.create({
          id: data.schema.id,
          value: data,
        })
      )
      .catch((err) => {
        throw new ConflictException(err.message);
      });
  }

  async update(id: string, data: Template) {
    if (id !== data.schema.id) {
      throw new ConflictException('Id in path and in data do not match');
    }
    await this.templateRepository.update({ id }, { value: data });
  }

  async delete(id: string) {
    await this.templateRepository.delete({ id });
  }
}
