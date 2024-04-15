import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakUser } from 'src/auth/user';
import { CreateKey } from './dto/create-key.dto';
import { KeyResponse } from './dto/key-response.dto';
import { ProofRequest } from './dto/proof-request.dto';
import { SignRequest } from './dto/sign-request.dto';
import { VerifyRequest } from './dto/verify-request.dto';
import { KeysService } from './keys.service';

@UseGuards(AuthGuard)
@ApiOAuth2([])
@ApiTags('keys')
@Controller('keys')
export class KeysController {
  constructor(private keysService: KeysService) {}

  /**
   * Create a new key
   */
  @ApiOperation({ summary: 'create a new key' })
  @ApiBody({ type: CreateKey })
  @ApiCreatedResponse({ description: 'Key created successfully' })
  @Post()
  create(
    @Body() createKeyDto: CreateKey,
    @AuthenticatedUser() user: KeycloakUser
  ) {
    return this.keysService.create(createKeyDto, user.sub);
  }

  /**
   * Get all keys
   * @param user
   * @returns
   */
  @ApiOperation({ summary: 'get all keys' })
  @Get()
  findAll(@AuthenticatedUser() user: KeycloakUser): Promise<KeyResponse[]> {
    return this.keysService.findAll(user.sub);
  }

  @ApiOperation({
    summary: 'proof a message',
  })
  @Post('proof')
  proof(@Body() value: ProofRequest, @AuthenticatedUser() user: KeycloakUser) {
    return this.keysService.proof(user.sub, value);
  }

  /**
   *
   * @param id
   * @param user
   * @returns
   */
  @ApiOperation({ summary: 'get a key' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: KeycloakUser
  ): Promise<KeyResponse> {
    return this.keysService.findOne(id, user.sub).catch(() => {
      throw new ConflictException('Key not found');
    });
  }

  /**
   * Signs a message with the given key.
   * @param id
   * @param value
   * @param user
   * @returns
   */
  @ApiOperation({
    summary: 'sign a message',
    description: 'Sign a message with the given key reference.',
  })
  @Post(':id/sign')
  sign(
    @Param('id') id: string,
    @Body() value: SignRequest,
    @AuthenticatedUser() user: KeycloakUser
  ) {
    return this.keysService.sign(id, user.sub, value);
  }

  /**
   * Verifies the signature of a message with the given key.
   * @param id
   * @param value
   * @param user
   * @returns
   */
  @ApiOperation({
    summary: 'verify a message',
    description:
      'Verifies the signature of a message with the given key reference.',
  })
  @Post(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() value: VerifyRequest,
    @AuthenticatedUser() user: KeycloakUser
  ) {
    return this.keysService.verify(id, user.sub, value);
  }

  /**
   *
   * @param id
   * @param user
   * @returns
   */
  @ApiOperation({ summary: 'delete a key' })
  @Delete(':id')
  remove(@Param('id') id: string, @AuthenticatedUser() user: KeycloakUser) {
    return this.keysService.remove(id, user.sub).then(() => ({ id }));
  }
}
