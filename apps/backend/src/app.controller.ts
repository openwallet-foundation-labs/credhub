import { Controller, Get } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return 'ok';
  }
}
