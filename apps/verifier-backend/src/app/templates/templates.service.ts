import { ConflictException, Injectable } from '@nestjs/common';
import { TemplateDto } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Template } from './schemas/temoplate.entity';

@Injectable()
export class TemplatesService {
  folder: string;
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
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
        TemplateDto,
        JSON.parse(readFileSync(join(credentialFolder, file), 'utf-8'))
      );
      const errors = await validate(template);
      if (errors.length > 0) {
        console.error(JSON.stringify(errors, null, 2));
      } else {
        //check if an id is already used
        await this.templateRepository
          .find()
          .then((templates) =>
            templates.find((t) => t.value.name === template.name)
          )
          .then((res) => {
            if (!res) {
              return this.create(template);
            }
          });
      }
    }
  }

  listAll() {
    return this.templateRepository.find();
  }

  async getOne(id: string): Promise<Template> {
    return this.templateRepository.findOneByOrFail({ id }).catch(() => {
      throw new ConflictException('Template not found');
    });
  }

  async create(value: TemplateDto) {
    await this.templateRepository
      .save(
        this.templateRepository.create({
          value,
        })
      )
      .catch((err) => {
        throw new ConflictException(err.message);
      });
  }

  async update(id: string, data: TemplateDto) {
    await this.templateRepository.update({ id }, { value: data });
  }

  async delete(id: string) {
    await this.templateRepository.delete({ id });
  }
}
