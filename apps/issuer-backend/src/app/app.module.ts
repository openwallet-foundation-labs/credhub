import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {
  AuthModule,
  KEY_VALIDATION_SCHEMA,
  KeyModule,
} from '@my-wallet/relying-party-shared';
import { IssuerModule } from './issuer/issuer.module';
import { DB_VALIDATION_SCHEMA, DbModule } from './db/db.module';
import { CredentialsModule } from './credentials/credentials.module';
import { StatusModule } from './status/status.module';

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
        ...DB_VALIDATION_SCHEMA,
        ...KEY_VALIDATION_SCHEMA,
      }),
    }),
    KeyModule.forRootSync(),
    IssuerModule,
    AuthModule,
    DbModule,
    CredentialsModule,
    StatusModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
