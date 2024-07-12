import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOAuth2, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { Template } from './dto/template.dto';
import { TemplatesService } from './template.service';

@ApiTags('templates')
@UseGuards(AuthGuard)
@ApiOAuth2([])
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @ApiOperation({ summary: 'List all templates' })
  @Get()
  async listAll(): Promise<Template[]> {
    return Object.values(
      Object.fromEntries(await this.templatesService.listAll())
    );
  }

  @ApiOperation({ summary: 'Get one template' })
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.templatesService.getOne(id);
  }

  @ApiOperation({ summary: 'Create a new template' })
  @Post()
  create(@Body() data: Template) {
    return this.templatesService.create(data);
  }

  @ApiOperation({ summary: 'Update a template' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Template) {
    return this.templatesService.update(id, data);
  }

  @ApiOperation({ summary: 'Delete a template' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }
}
