import { ConflictException, Injectable } from '@nestjs/common';
import { Template } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template as TemplateEntity } from './schemas/temoplate.entity';
import { Repository } from 'typeorm';
import { CredentialConfigurationSupportedV1_0_13 } from '@sphereon/oid4vci-common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class TemplatesService {
  folder: string;
  constructor(
    @InjectRepository(TemplateEntity)
    private templateRepository: Repository<TemplateEntity>,
    private configSerivce: ConfigService
  ) {
    this.folder = this.configSerivce.get('CREDENTIALS_FOLDER');
  }

  /**
   * Import templates for the local system when they are not already in the database. Do not overwrite existing templates.
   */
  async import() {
    const credentialFolder = join(this.folder, 'credentials');
    const files = readdirSync(credentialFolder);
    for (const file of files) {
      const template = plainToInstance(
        Template,
        JSON.parse(readFileSync(join(credentialFolder, file), 'utf-8'))
      );
      const errors = await validate(template);
      if (errors.length > 0) {
        console.error(JSON.stringify(errors, null, 2));
      } else {
        //check if an id is already used
        await this.getOne(template.schema.id).catch(async () => {
          await this.create(template);
        });
      }
    }
  }

  getSupported(value: Map<string, Template>) {
    //iterate over the map and change the value
    const result: Record<string, CredentialConfigurationSupportedV1_0_13> = {};
    value.forEach((v, k) => {
      result[k] = v.schema;
    });
    return result;
  }

  async listAll() {
    const rec: Map<string, Template> = new Map();
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
