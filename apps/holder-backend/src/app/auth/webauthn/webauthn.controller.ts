import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { WebauthnService } from './webauthn.service';
import { KeycloakUser } from '../user';
import { RegistrationResponse } from './dto/registration-response.dto';
import { Request } from 'express';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('auth')
@Controller('webauthn')
export class WebAuthnController {
  constructor(private webAuthnService: WebauthnService) {}

  @ApiOperation({ summary: 'get registration options' })
  @Get('registration')
  getRegistrationOptions(@AuthenticatedUser() user: KeycloakUser) {
    return this.webAuthnService.generateRegistrationOptions(
      user.sub,
      user.email
    );
  }

  @ApiOperation({ summary: 'complete registration' })
  @Post('registration')
  verifyRegistration(
    @AuthenticatedUser() user: KeycloakUser,
    @Body() body: RegistrationResponse,
    @Req() req: Request
  ) {
    const expectedOrigin = req.headers.origin;
    return this.webAuthnService.startRegistration(
      user.sub,
      body,
      expectedOrigin
    );
  }

  @ApiOperation({ summary: 'get keys' })
  @Get('keys')
  getKeys(@AuthenticatedUser() user: KeycloakUser) {
    return this.webAuthnService.getKeys(user.sub);
  }

  @ApiOperation({ summary: 'delete key' })
  @Delete('keys/:id')
  deleteKey(@AuthenticatedUser() user: KeycloakUser, @Param('id') id: string) {
    return this.webAuthnService.deleteKey(user.sub, id);
  }

  @ApiOperation({ summary: 'get authentication options' })
  @Get('authentication')
  getAuthenticationOptions(@AuthenticatedUser() user: KeycloakUser) {
    return this.webAuthnService.generateAuthenticationOptions(user.sub);
  }
}
