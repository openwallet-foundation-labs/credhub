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

export const KEYCLOAK_VALIDATION_SCHEMA = {
  KEYCLOAK_AUTH_URL: Joi.string().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  KEYCLOAK_CLIENT_ID: Joi.string().required(),
};

@Global()
@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          authServerUrl: configService.get('KEYCLOAK_AUTH_URL'),
          realm: configService.get('KEYCLOAK_REALM'),
          clientId: configService.get('KEYCLOAK_CLIENT_ID'),
          policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
          //TODO: set this to online
          tokenValidation: TokenValidation.OFFLINE,
          //TODO: maybe setting verifyTokenAudience could work with the localhost problem
        }) as KeycloakConnectOptions,
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
