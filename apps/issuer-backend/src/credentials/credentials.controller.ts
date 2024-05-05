import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { ApiOAuth2, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  findAll() {
    return this.credentialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.credentialsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.credentialsService.remove(id);
  }
}
