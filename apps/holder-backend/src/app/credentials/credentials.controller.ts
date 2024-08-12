import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOAuth2,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { CredentialResponse } from './dto/credential-response.dto';
import { KeycloakUser } from '../auth/user';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @ApiOperation({ summary: 'store a credential' })
  @ApiBody({ type: CreateCredentialDto })
  @Post()
  create(
    @Body() createCredentialDto: CreateCredentialDto,
    @AuthenticatedUser() user: KeycloakUser
  ) {
    return this.credentialsService.create(createCredentialDto, user.sub);
  }

  @ApiOperation({ summary: 'get all credentials' })
  @ApiQuery({ name: 'archive', required: false, type: Boolean })
  @Get()
  async findAll(
    @AuthenticatedUser() user: KeycloakUser,
    @Query('archive') archive: boolean
  ) {
    const credentials = await this.credentialsService.findAll(
      user.sub,
      archive
    );
    return credentials.map((credential) => ({
      id: credential.id,
      display: credential.metaData.display?.[0],
      issuer: credential.issuer,
    }));
  }

  @ApiOperation({ summary: 'get a credential' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: KeycloakUser
  ): Promise<CredentialResponse> {
    //TODO: return the parsed values so the client does not have to decode it.
    return this.credentialsService.showOne(id, user.sub).catch(() => {
      throw new ConflictException();
    });
  }

  @ApiOperation({ summary: 'delete a credential' })
  @Delete(':id')
  remove(@Param('id') id: string, @AuthenticatedUser() user: KeycloakUser) {
    return this.credentialsService.remove(id, user.sub);
  }
}
