import { ConflictException, Injectable } from '@nestjs/common';
import { TemplatesService } from './templates.interface';
import { Template } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template as TemplateEntity } from './schemas/temoplate.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TemplatesDBService implements TemplatesService {
  constructor(
    @InjectRepository(TemplateEntity)
    private templateRepository: Repository<TemplateEntity>
  ) {}

  listAll() {
    return this.templateRepository
      .find()
      .then((entries) => entries.map((entry) => entry.value));
  }
  async getOne(id: string) {
    const files = await this.listAll();
    const template = files.find((file) => file.request.id === id);
    if (!template) {
      throw new ConflictException('Template not found');
    }
    return template;
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
