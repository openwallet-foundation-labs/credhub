import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
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
import { DBRPSessionManager } from './session-manager';
import { KeyService } from '@credhub/relying-party-shared';
import { SiopCreateResponse } from './dto/siop-create-response.dto';

@ApiTags('siop')
@Controller('siop')
export class SiopController {
  constructor(
    private readonly relyingPartyManagerService: RelyingPartyManagerService,
    private configService: ConfigService,
    @Inject('KeyService') private keyService: KeyService
  ) {}

  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @Roles({ roles: ['realm:verifier'], mode: RoleMatchingMode.ALL })
  @ApiOperation({ summary: 'Create a session' })
  @Post(':id')
  async createSession(@Param('id') id: string): Promise<SiopCreateResponse> {
    const instance = await this.relyingPartyManagerService.getOrCreate(id);
    const jwk = await this.keyService.getPublicKey();

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
      jwtIssuer: { method: 'jwk', jwk },
    });
    return {
      uri: request.encodedUri,
      id: correlationId,
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

  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Get all auth request' })
  @Get(':rp/auth-request')
  async getAllAuthRequest(@Param('rp') rp: string) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    return (instance.rp.sessionManager as DBRPSessionManager).getAllStates();
  }

  /**
   * Add the route to get the status of the request
   */
  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Get the uri of the auth request' })
  @Get(':rp/auth-request/:correlationId/uri')
  async getAuthRequestUri(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string
  ) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    const request =
      await instance.rp.sessionManager.getRequestStateByCorrelationId(
        correlationId
      );
    if (!request) {
      throw new ConflictException('Request not found');
    }
    // we build the string by ourself since it can not be done by the library
    return {
      uri: `${
        request.request.payload.scope
      }://?request_uri=${encodeURIComponent(
        request.request.payload.response_uri.replace(
          'auth-response',
          'auth-request'
        )
      )}`,
    };
  }

  /**
   * Add the route to get the status of the request
   */
  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Get the response of the auth request' })
  @Get(':rp/auth-request/:correlationId/response')
  async getAuthRequestResponse(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string
  ) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    const response =
      await instance.rp.sessionManager.getResponseStateByCorrelationId(
        correlationId
      );
    if (!response) {
      throw new ConflictException('Request not found');
    }
    //TODO: instead of decoding the vp_token, we should use the stored credential and return this?
    return response.response;
  }

  /**
   * Add the route to get the status of the request
   */
  @UseGuards(AuthGuard)
  @ApiOAuth2([])
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
    return {
      status: response?.status || request?.status,
      lastUpdated: response?.lastUpdated || request?.lastUpdated,
      request: request?.request.payload,
      response: response?.response.payload,
    };
  }

  /**
   * Add the route to get the status of the request
   */
  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Get the info of the auth request' })
  @Get(':rp/auth-request/:correlationId/info')
  async getRequestInfo(
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
    return { request, response };
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
          correlationId,
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

  @UseGuards(AuthGuard)
  @ApiOAuth2([])
  @ApiOperation({ summary: 'delete a rp auth request' })
  @Delete(':rp/auth-request/:correlationId')
  async deleteAuthRequest(
    @Param('rp') rp: string,
    @Param('correlationId') correlationId: string
  ) {
    const instance = await this.relyingPartyManagerService.getOrCreate(rp);
    await instance.rp.sessionManager.deleteStateForCorrelationId(correlationId);
  }

  /**
   * This will remove a rp so it can be reloaded with new values
   */
  @UseGuards(AuthGuard)
  @ApiOAuth2([])
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
