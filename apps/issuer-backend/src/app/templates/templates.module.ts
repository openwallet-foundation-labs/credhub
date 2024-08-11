import { Module, OnModuleInit } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './schemas/temoplate.entity';
import { TemplatesService } from './template.service';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity])],
  controllers: [TemplatesController, MetadataController],
  providers: [TemplatesService, MetadataService],
  exports: [TemplatesService, MetadataService],
})
export class TemplatesModule implements OnModuleInit {
  constructor(private readonly templatesService: TemplatesService) {}

  async onModuleInit() {
    // import local templates to the database
    await this.templatesService.import();
  }
}
