import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import {
  AuthGuard,
  KeycloakConnectModule,
  type KeycloakConnectOptions,
  PolicyEnforcementMode,
  ResourceGuard,
  RoleGuard,
  TokenValidation,
} from 'nest-keycloak-connect';

export const OIDC_VALIDATION_SCHEMA = {
  OIDC_AUTH_URL: Joi.string().required(),
  OIDC_REALM: Joi.string().required(),
  OIDC_CLIENT_ID: Joi.string().required(),
};

@Global()
@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          authServerUrl: configService.get('OIDC_AUTH_URL'),
          realm: configService.get('OIDC_REALM'),
          clientId: configService.get('OIDC_CLIENT_ID'),
          policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
          //TODO: set this to online
          tokenValidation: TokenValidation.OFFLINE,
          //TODO: maybe setting verifyTokenAudience could work with the localhost problem
        } as KeycloakConnectOptions),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  exports: [KeycloakConnectModule],
})
export class AuthModule {}
