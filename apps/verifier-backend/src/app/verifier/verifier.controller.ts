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
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  Public,
  RoleMatchingMode,
  Roles,
} from 'nest-keycloak-connect';
import {
  AuthorizationResponsePayload,
  PresentationDefinitionLocation,
  SupportedVersion,
} from '@sphereon/did-auth-siop';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { AuthResponseRequestDto } from './dto/auth-repsonse-request.dto';

@ApiTags('siop')
@UseGuards(AuthGuard)
@ApiOAuth2([])
@Controller('siop')
export class VerifierController {
  constructor(
    private readonly relyingPartyManagerService: RelyingPartyManagerService,
    private configService: ConfigService
  ) {}

  @Roles({ roles: ['realm:verifier'], mode: RoleMatchingMode.ALL })
  @ApiOperation({ summary: 'Create a session' })
  @Post(':id')
  async createSession(@Param('id') id: string) {
    const instance = await this.relyingPartyManagerService.getOrCreate(id);

    const correlationId = v4();
    const nonce = v4();
    const state = v4();
    const requestByReferenceURI = `${this.configService.get(
      'VERIFIER_BASE_URL'
    )}/siop/${id}/auth-request/${correlationId}`;
    const responseURI = `${this.configService.get(
      'VERIFIER_BASE_URL'
    )}/siop/${id}/auth-response/${correlationId}`;
    const request = await instance.rp.createAuthorizationRequestURI({
      correlationId,
      nonce,
      state,
      version: SupportedVersion.SIOPv2_D12_OID4VP_D18,
      requestByReferenceURI,
      responseURI,
      responseURIType: 'response_uri',
    });
    return {
      uri: request.encodedUri,
    };
  }

  @Public()
  @ApiOperation({ summary: 'Get the auth request' })
  @Get(':rp/auth-request/:correlationId')
  async getAuthRequest(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string
  ) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    const request =
      await instance.rp.sessionManager.getRequestStateByCorrelationId(
        correlationId
      );
    return await request?.request.requestObject?.toJwt();
  }

  /**
   * Add the route to get the status of the request
   */
  @Public()
  @ApiOperation({ summary: 'Get the status of the auth request' })
  @Get(':rp/auth-request/:correlationId/status')
  async getAuthRequestStatus(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string
  ) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    const request =
      await instance.rp.sessionManager.getRequestStateByCorrelationId(
        correlationId
      );
    const response =
      await instance.rp.sessionManager.getResponseStateByCorrelationId(
        correlationId
      );
    if (!request) {
      throw new ConflictException('Request not found');
    }
    return { status: response?.status || request?.status };
  }
  /**
   * Add the route to get the response object
   */
  @Public()
  @ApiOperation({ summary: 'Get the auth response' })
  @Post(':rp/auth-response/:correlationId')
  async getAuthResponse(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string,
    @Body() body: AuthResponseRequestDto
  ) {
    body.presentation_submission = JSON.parse(
      body.presentation_submission as string
    );
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    try {
      const response = await instance.rp.verifyAuthorizationResponse(
        body as AuthorizationResponsePayload,
        {
          correlationId: correlationId,
          //TODO: do we need it here when we added it in the constructor?
          presentationDefinitions: {
            definition: instance.verifier.request,
            location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN,
          },
        }
      );
      return { status: response.state };
    } catch (e) {
      console.log(e);
      throw new ConflictException((e as Error).message);
    }
  }

  /**
   * This will remove a rp so it can be reloaded with new values
   */
  @Roles({ roles: ['realm:verifier'], mode: RoleMatchingMode.ALL })
  @ApiOperation({ summary: 'Remove a relying party' })
  @Delete(':rp')
  async removeRP(@Param('rp') rp: string) {
    if (!this.configService.get('CONFIG_RELOAD')) {
      throw new ConflictException('Not allowed');
    }
    await this.relyingPartyManagerService.remove(rp, true);
  }
}
