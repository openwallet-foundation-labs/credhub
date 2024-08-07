import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Headers,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StatusService } from './status.service';
import { AuthGuard, Public } from 'nest-keycloak-connect';
import { CreateListDto } from './dto/create-list.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { StatusListAccept } from './status-list-accept';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('status')
@Controller('status')
export class StatusController {
  constructor(private statusService: StatusService) {}

  @ApiHeader({
    name: 'Accept',
    description:
      'Type of the response, but not accepted due to a swagger bug...',
    example: 'application/statuslist+jwt' as StatusListAccept,
    enum: [
      'application/statuslist+jwt',
      'application/statuslist+json',
    ] as StatusListAccept[],
  })
  @ApiOperation({ summary: 'Get the status list as JWT' })
  @Public()
  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @Headers('Accept') accept: StatusListAccept,
    @Res() res
  ) {
    const jwt = await this.statusService.getOne(id);
    if (accept === 'application/statuslist+json') {
      throw new Error('Not implemented');
      res
        .setHeader(
          'Content-Type',
          'application/statuslist+json' as StatusListAccept
        )
        .send(JSON.parse(jwt));
    } else {
      res.setHeader('Content-Type', 'application/statuslist+jwt').send(jwt);
    }
  }

  @ApiOperation({ summary: 'Create a new status list' })
  @ApiBody({ type: CreateListDto })
  @Post()
  create(@Body() createListDto: CreateListDto) {
    return this.statusService.create(createListDto);
  }

  @ApiOperation({ summary: 'Change the status of a specific index' })
  @Post(':id/:index')
  changeStatus(
    @Param('id') list: string,
    @Param('index') index: number,
    @Body() changeStatus: ChangeStatusDto
  ) {
    return this.statusService.setStatus(list, index, changeStatus.status);
  }

  @Public()
  @ApiOperation({ summary: 'Get the status of a specific index' })
  @Get(':id/:index')
  getStatus(@Param('id') id: string, @Param('index') index: number) {
    return this.statusService.getStatus(id, index).then((status) => ({
      status,
    }));
  }

  @ApiOperation({ summary: 'Delete a status list' })
  @Delete(':id')
  deleteList(@Param('id') id: string) {
    return this.statusService.deleteList(id);
  }
}
