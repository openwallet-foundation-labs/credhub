import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { WebauthnService } from './entities/webauthn.service';
import { KeycloakUser } from '../user';
import { RegistrationResponseJSON } from '@simplewebauthn/types';
import { RegistrationResponse } from './dto/registration-response.dto';
import { AuthenticationResponse } from './dto/authentication-response.dto';

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
    @Body() body: RegistrationResponse
  ) {
    return this.webAuthnService.startRegistration(user.sub, body);
  }

  @ApiOperation({ summary: 'get authentication options' })
  @Get('authentication')
  getAuthenticationOptions(@AuthenticatedUser() user: KeycloakUser) {
    return this.webAuthnService.generateAuthenticationOptions(user.sub);
  }

  @ApiOperation({ summary: 'complete authentication' })
  @Post('authentication')
  verifyAuthentication(
    @AuthenticatedUser() user: KeycloakUser,
    @Body() body: AuthenticationResponse
  ) {
    return this.webAuthnService.verifyAuthenticationResponse(user.sub, body);
  }
}
