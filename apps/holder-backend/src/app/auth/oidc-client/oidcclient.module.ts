import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeycloakOIDCClient } from './keycloak-oidc-client';
import * as Joi from 'joi';

export const oidcclientName = 'OidcClientService';

export const OIDC_CLIENT_SCHEMA = {
  OIDC_TYPE: Joi.string().valid('keycloak').default('keycloak'),
  OIDC_ADMIN_CLIENT_ID: Joi.string().when('OIDC_TYPE', {
    is: 'keycloak',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  OIDC_ADMIN_CLIENT_SECRET: Joi.string().when('OIDC_TYPE', {
    is: 'keycloak',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
};

@Module({})
export class OidcClientModule {
  static forRoot(): DynamicModule {
    return {
      module: OidcClientModule,
      imports: [ConfigModule, HttpModule],
      providers: [
        {
          provide: oidcclientName,
          useFactory: (
            configService: ConfigService,
            httpService: HttpService
          ) => new KeycloakOIDCClient(httpService, configService),
          inject: [ConfigService, HttpService],
        },
      ],
      exports: [oidcclientName],
    };
  }
}
