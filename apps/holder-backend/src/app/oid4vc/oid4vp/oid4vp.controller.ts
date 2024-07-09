import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { Oid4vpParseRequest } from './dto/parse-request.dto';
import { Oid4vpParseRepsonse } from './dto/parse-response.dto';
import { SubmissionRequest } from './dto/submission-request.dto';
import { Oid4vpService } from './oid4vp.service';
import { KeycloakUser } from '../../auth/user';
import { WebauthnService } from '../../auth/webauthn/webauthn.service';
import { Request } from 'express';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('oid4vp')
@Controller('oid4vp')
export class Oid4vpController {
  constructor(
    private readonly oid4vciService: Oid4vpService,
    private readonly webauthnService: WebauthnService
  ) {}

  @ApiOperation({ summary: 'parse a URL' })
  @Post('parse')
  @ApiCreatedResponse({ description: 'URL parsed', type: Oid4vpParseRepsonse })
  parse(
    @Body() value: Oid4vpParseRequest,
    @AuthenticatedUser() user: KeycloakUser
  ): Promise<Oid4vpParseRepsonse> {
    return this.oid4vciService.parse(value, user.sub);
  }

  @ApiOperation({ summary: 'submit a response' })
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body() value: SubmissionRequest,
    @AuthenticatedUser() user: KeycloakUser,
    @Req() req: Request
  ) {
    const origin = req.headers.origin;
    if (await this.webauthnService.hasKeys(user.sub)) {
      if (!value.auth) {
        throw new ConflictException('No authentication provided');
      }
      await this.webauthnService.verifyAuthenticationResponse(
        value.auth.session,
        user.sub,
        value.auth.response,
        origin
      );
    }
    return this.oid4vciService.accept(id, user.sub, value.values);
  }

  @ApiOperation({ summary: 'decline a request' })
  @Delete(':id/delete')
  decline(@Param('id') id: string, @AuthenticatedUser() user: KeycloakUser) {
    return this.oid4vciService.decline(id, user.sub);
  }
}
