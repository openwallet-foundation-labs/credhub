import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { SessionRequestDto } from './dto/session-request.dto';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { SessionResponseDto } from './dto/session-response.dto';
import { CredentialOfferSession } from './dto/credential-offer-session.dto';
import { DBStates } from '@credhub/relying-party-shared';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('sessions')
@Controller('sessions')
export class IssuerController {
  constructor(private issuerService: IssuerService) {}

  @ApiOperation({ summary: 'Lists all sessions' })
  @Get()
  async listAll(): Promise<CredentialOfferSession[]> {
    return (
      this.issuerService.vcIssuer
        .credentialOfferSessions as DBStates<CredentialOfferSession>
    ).all();
  }

  @ApiOperation({ summary: 'Returns the status for a session' })
  @Get(':id')
  async getSession(@Param('id') id: string): Promise<CredentialOfferSession> {
    const session =
      (await this.issuerService.vcIssuer.credentialOfferSessions.get(
        id
      )) as CredentialOfferSession;
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session;
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
