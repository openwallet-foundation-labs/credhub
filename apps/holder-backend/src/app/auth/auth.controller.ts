import { Controller, Delete, UseGuards } from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakUser } from './user';
import { AuthService } from './auth.service';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'delete account' })
  @Delete()
  deleteAccount(@AuthenticatedUser() user: KeycloakUser) {
    return this.authService.deleteAccount(user.sub);
  }
}
