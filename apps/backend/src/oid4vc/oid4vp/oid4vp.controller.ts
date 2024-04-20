import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakUser } from 'src/auth/user';
import { Oid4vpParseRequest } from './dto/parse-request.dto';
import { Oid4vpParseRepsonse } from './dto/parse-response.dto';
import { SubmissionRequest } from './dto/submission-request.dto';
import { Oid4vpService } from './oid4vp.service';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('oid4vcp')
@Controller('oid4vp')
export class Oid4vpController {
  constructor(private readonly oid4vciService: Oid4vpService) {}

  @ApiOperation({ summary: 'parse a URL' })
  @Post('parse')
  @ApiCreatedResponse({ description: 'URL parsed', type: Oid4vpParseRepsonse })
  parse(
    @Body() value: Oid4vpParseRequest,
    @AuthenticatedUser() user: KeycloakUser
  ): Promise<Oid4vpParseRepsonse> {
    return this.oid4vciService.parse(value.url, user.sub);
  }

  @ApiOperation({ summary: 'submit a response' })
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() value: SubmissionRequest,
    @AuthenticatedUser() user: KeycloakUser
  ) {
    return this.oid4vciService.accept(id, user.sub, value);
  }

  @ApiOperation({ summary: 'decline a request' })
  @Delete(':id/delete')
  decline(@Param('id') id: string, @AuthenticatedUser() user: KeycloakUser) {
    return this.oid4vciService.decline(id, user.sub);
  }
}
