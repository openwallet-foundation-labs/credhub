import { ConflictException, Injectable } from '@nestjs/common';
import { Template } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template as TemplateEntity } from './schemas/temoplate.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

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
    const credentialFolder = join(this.folder);
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
        await this.getOne(template.request.id).catch(async () => {
          await this.create(template);
        });
      }
    }
  }

  listAll(): Promise<Template[]> {
    return this.templateRepository
      .find()
      .then((entries) => entries.map((entry) => entry.value));
  }

  async getOne(id: string): Promise<Template> {
    return this.templateRepository.findOneByOrFail({ id }).then(
      (entry) => entry.value,
      () => {
        throw new ConflictException('Template not found');
      }
    );
  }
  async create(data: Template) {
    await this.templateRepository
      .save(
        this.templateRepository.create({
          id: data.request.id,
          value: data,
        })
      )
      .catch((err) => {
        throw new ConflictException(err.message);
      });
  }

  async update(id: string, data: Template) {
    await this.templateRepository.update({ id }, { value: data });
  }

  async delete(id: string) {
    await this.templateRepository.delete({ id });
  }
}
