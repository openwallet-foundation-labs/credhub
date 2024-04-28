import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOAuth2, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { HistoryService } from './history.service';
import { KeycloakUser } from 'src/auth/user';
import { HistoryResponse } from './dto/history-response.dto';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @ApiOperation({ summary: 'get all elements' })
  @Get()
  all(@AuthenticatedUser() user: KeycloakUser) {
    return this.historyService.all(user.sub);
  }

  @ApiOperation({ summary: 'get one element' })
  @Get(':id')
  getOne(
    @AuthenticatedUser() user: KeycloakUser,
    @Param('id') id: string
  ): Promise<HistoryResponse> {
    return this.historyService.getOne(id, user.sub);
  }

  @ApiOperation({ summary: 'delete all entries' })
  @Delete()
  async delete(@AuthenticatedUser() user: KeycloakUser) {
    await this.historyService.delete(user.sub);
  }
}
