import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesFileService } from './templates-file.service';
import { ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './schemas/temoplate.entity';
import { TemplatesDBService } from './template-db.service';
import { Repository } from 'typeorm';

export const TEMPLATE_VALIDATION_SCHEMA = {
  TEMPLATE_TYPE: Joi.string().valid('file', 'db').default('file'),
};

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  controllers: [TemplatesController],
  providers: [
    {
      provide: 'TemplatesService',
      useFactory: (
        configService: ConfigService,
        templateRepository: Repository<Template>
      ) => {
        const templateType = configService.get<string>('TEMPLATE_TYPE');
        return templateType === 'file'
          ? new TemplatesFileService(configService)
          : new TemplatesDBService(templateRepository);
      },
      inject: [ConfigService, getRepositoryToken(Template)],
    },
  ],
  exports: ['TemplatesService'],
})
export class TemplatesModule {}
