import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { IssuerService } from '../issuer.service';

@ApiTags('.well-known')
@Controller('.well-known')
export class WellKnownController {
  constructor(private readonly issuerService: IssuerService) {}

  @ApiOperation({ summary: 'Returns the issuer metadata' })
  @Public()
  @Get('jwt-vc-issuer')
  wellKnown() {
    return this.issuerService.getIssuerMetadata();
  }
}
