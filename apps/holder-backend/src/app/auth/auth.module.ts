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
import { TypeOrmModule } from '@nestjs/typeorm';
import { Passkey } from './webauthn/entities/passkey.entity';
import { WebAuthnController } from './webauthn/webauthn.controller';
import { WebauthnService } from './webauthn/webauthn.service';

export const OIDC_VALIDATION_SCHEMA = {
  OIDC_AUTH_URL: Joi.string().required(),
  OIDC_REALM: Joi.string().required(),
  OIDC_PUBLIC_CLIENT_ID: Joi.string().required(),
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
          authServerUrl: configService.get('OIDC_AUTH_URL'),
          //when referencing the realm, it is not possible to use another oidc than keycloak for now
          realm: configService.get('OIDC_REALM'),
          // we need the client id and secret to validare if a token got revoked. The client needs to have a service account with manage user permissions
          clientId: configService.get('OIDC_ADMIN_CLIENT_ID'),
          secret: configService.get('OIDC_ADMIN_CLIENT_SECRET'),
          policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
          tokenValidation: TokenValidation.ONLINE,
        } as KeycloakConnectOptions),
    }),
    OidcClientModule.forRoot(),
    TypeOrmModule.forFeature([Passkey]),
    ConfigModule,
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
    WebauthnService,
  ],
  exports: [KeycloakConnectModule, WebauthnService],
  controllers: [AuthController, WebAuthnController],
})
export class AuthModule {}
