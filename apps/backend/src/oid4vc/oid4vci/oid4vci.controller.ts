import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakUser } from 'src/auth/user';
import { Oid4vciParseRequest } from './dto/parse-request.dto';
import { Oid4vciParseRepsonse } from './dto/parse-response.dto';
import { Oid4vciService } from './oid4vci.service';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('oid4vci')
@Controller('oid4vci')
export class Oid4vciController {
  constructor(private readonly oid4vciService: Oid4vciService) {}

  @ApiOperation({ summary: 'parse a URL, returns the included information' })
  @Post('parse')
  @ApiCreatedResponse({ description: 'URL parsed', type: Oid4vciParseRepsonse })
  parse(@Body() value: Oid4vciParseRequest): Promise<Oid4vciParseRepsonse> {
    return this.oid4vciService.parse(value.url);
  }

  @ApiOperation({ summary: 'accept a credential' })
  @Get('accept/:id')
  accept(@Param('id') id: string, @AuthenticatedUser() user: KeycloakUser) {
    return this.oid4vciService.accept(id, user.sub);
  }
}
