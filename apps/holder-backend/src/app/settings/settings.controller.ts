import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/setting-request.dto';
import { SettingResponse } from './dto/setting-response.dto';
import { KeycloakUser } from '../auth/user';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiOperation({ summary: 'get settings' })
  @Get()
  getSettings(
    @AuthenticatedUser() user: KeycloakUser
  ): Promise<SettingResponse> {
    return this.settingsService.getSettings(user.sub).then((settings) => {
      settings.user = undefined;
      return settings;
    });
  }

  @ApiOperation({ summary: 'set settings' })
  @Post()
  setSettings(
    @AuthenticatedUser() user: KeycloakUser,
    @Body() values: UpdateSettingsDto
  ) {
    return this.settingsService.setSettings(user.sub, values);
  }
}
