import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesFileService } from './templates-file.service';
import { ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './schemas/temoplate.entity';

export const TEMPLATE_VALIDATION_SCHEMA = {
  TEMPLATE_TYPE: Joi.string().valid('file').default('file'),
};

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  controllers: [TemplatesController],
  providers: [
    {
      provide: 'TemplateService',
      useFactory: (configService: ConfigService) => {
        const templateType = configService.get<string>('TEMPLATE_TYPE');
        return templateType === 'file'
          ? new TemplatesFileService(configService)
          : undefined;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['TemplateService'],
})
export class TemplatesModule {}
