import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';

@Controller()
export class AppController {
  /**
   * Health check endpoint
   * @returns
   */
  @ApiOperation({ summary: 'Health check endpoint' })
  @Public()
  @Get('health')
  health() {
    //TODO: for a better health check, use https://docs.nestjs.com/recipes/terminus#setting-up-a-healthcheck
    return 'ok';
  }
}
