import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {
  AuthModule,
  CRYPTO_VALIDATION_SCHEMA,
  KEY_VALIDATION_SCHEMA,
  KeyModule,
  OIDC_VALIDATION_SCHEMA,
} from '@credhub/relying-party-shared';
import { DB_VALIDATION_SCHEMA, DbModule } from '@credhub/relying-party-shared';
import { CredentialsModule } from './credentials/credentials.module';
import { StatusModule } from './status/status.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IssuerModule } from './issuer/issuer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        CONFIG_RELOAD: Joi.boolean().default(false),
        ISSUER_BASE_URL: Joi.string().required(),
        NODE_ENVIRONMENT: Joi.string()
          .valid('development', 'production')
          .default('development'),
        CREDENTIALS_FOLDER: Joi.string().required(),
        //TODO: we only need this, when we configured datbase type, not file type
        ...DB_VALIDATION_SCHEMA,
        ...KEY_VALIDATION_SCHEMA,
        ...CRYPTO_VALIDATION_SCHEMA,
        ...OIDC_VALIDATION_SCHEMA,
      }),
    }),
    KeyModule.forRoot(),
    ScheduleModule.forRoot(),
    IssuerModule,
    AuthModule,
    DbModule,
    CredentialsModule,
    StatusModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
