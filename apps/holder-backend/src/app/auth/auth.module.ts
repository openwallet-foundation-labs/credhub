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
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  OIDC_CLIENT_SCHEMA,
  OidcClientModule,
} from './oidc-client/oidcclient.module';

export const KEYCLOAK_VALIDATION_SCHEMA = {
  //TODO: rename to oidc auth url to be independant from keycloak
  KEYCLOAK_AUTH_URL: Joi.string().required(),
  KEYCLOAK_REALM: Joi.string().required(),
  ...OIDC_CLIENT_SCHEMA,
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
        } as KeycloakConnectOptions),
    }),
    OidcClientModule.forRoot(),
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
    AuthService,
  ],
  exports: [KeycloakConnectModule],
  controllers: [AuthController],
})
export class AuthModule {}
