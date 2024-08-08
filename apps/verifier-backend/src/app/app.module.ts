import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { VerifierModule } from './verifier/verifier.module';
import {
  AuthModule,
  DB_VALIDATION_SCHEMA,
  DbModule,
  KeyModule,
  OIDC_VALIDATION_SCHEMA,
} from '@credhub/relying-party-shared';
import { TemplatesModule } from './templates/templates.module';
import { CRYPTO_VALIDATION_SCHEMA } from '@credhub/backend';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        CONFIG_RELOAD: Joi.boolean().default(false),
        VERIFIER_BASE_URL: Joi.string().required(),
        NODE_ENVIRONMENT: Joi.string()
          .valid('development', 'production')
          .default('development'),
        CREDENTIALS_FOLDER: Joi.string().required(),
        ...OIDC_VALIDATION_SCHEMA,
        ...CRYPTO_VALIDATION_SCHEMA,
        ...DB_VALIDATION_SCHEMA,
      }),
    }),
    DbModule,
    VerifierModule,
    KeyModule.forRoot(),
    TemplatesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
