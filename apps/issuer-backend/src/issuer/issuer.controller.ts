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
import { AuthGuard, Public } from 'nest-keycloak-connect';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('sessions')
@Controller('sessions')
export class IssuerController {
  constructor(private issuerService: IssuerService) {}

  @ApiOperation({ summary: 'Returns the status for a session' })
  @Get(':id')
  async getSession(@Param('id') id: string) {
    const session =
      await this.issuerService.vcIssuer.credentialOfferSessions.get(id);
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session;
  }

  @ApiOperation({ summary: 'Creates a new session request' })
  @Post()
  async request(@Body() values: SessionRequestDto) {
    return this.issuerService.createRequest(values);
  }

  @ApiOperation({summary: 'Deletes a session by id'})
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.issuerService.vcIssuer.credentialOfferSessions.delete(id);
  }
}
