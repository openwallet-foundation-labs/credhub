import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { SessionRequestDto } from './dto/session-request.dto';
import { ApiOAuth2, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { SessionResponseDto } from './dto/session-response.dto';
import { CredentialOfferSession } from './dto/credential-offer-session.dto';
import { DBStates } from '@credhub/relying-party-shared';
import { CredentialsService } from '../credentials/credentials.service';
import { SessionEntryDto } from './dto/session-entry.dto';
import { CredentialOfferPayloadV1_0_13 } from '@sphereon/oid4vci-common';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('sessions')
@Controller('sessions')
export class IssuerController {
  constructor(
    private issuerService: IssuerService,
    private credentialsService: CredentialsService
  ) {}

  @ApiOperation({ summary: 'Lists all sessions' })
  @ApiQuery({ name: 'configId', required: false })
  @Get()
  async listAll(
    @Query('configId') configId?: string
  ): Promise<CredentialOfferSession[]> {
    return (
      this.issuerService.vcIssuer
        .credentialOfferSessions as DBStates<CredentialOfferSession>
    )
      .all()
      .then((entries) => {
        if (configId) {
          return entries.filter((entry) =>
            (
              entry.credentialOffer
                .credential_offer as CredentialOfferPayloadV1_0_13
            ).credential_configuration_ids.includes(configId)
          );
        }
        return entries;
      });
  }

  @ApiOperation({ summary: 'Returns the status for a session' })
  @Get(':id')
  async getSession(@Param('id') id: string): Promise<SessionEntryDto> {
    const session =
      (await this.issuerService.vcIssuer.credentialOfferSessions.get(
        id
      )) as CredentialOfferSession;
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    const credentials = await this.credentialsService.getBySessionId(id);
    return {
      session,
      credentials,
    };
  }

  @ApiOperation({ summary: 'Creates a new session request' })
  @Post()
  async request(
    @Body() values: SessionRequestDto
  ): Promise<SessionResponseDto> {
    return this.issuerService.createRequest(values);
  }

  @ApiOperation({ summary: 'Deletes a session by id' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.issuerService.vcIssuer.credentialOfferSessions.delete(id);
  }
}
