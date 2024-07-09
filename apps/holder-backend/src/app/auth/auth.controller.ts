import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { KeycloakUser } from './user';
import { AuthService } from './auth.service';
import { EndpointResponse } from './dto/endpoint-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'give information about the oidc provider' })
  @Public()
  @Get()
  endpoints(): EndpointResponse {
    return this.authService.endpoints();
  }

  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'delete account' })
  @Delete()
  deleteAccount(@AuthenticatedUser() user: KeycloakUser) {
    return this.authService.deleteAccount(user.sub);
  }
}
