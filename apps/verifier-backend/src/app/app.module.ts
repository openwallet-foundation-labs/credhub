import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { VerifierModule } from './verifier/verifier.module';
import {
  AuthModule,
  KeyModule,
  OIDC_VALIDATION_SCHEMA,
} from '@my-wallet/relying-party-shared';

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
      }),
    }),
    VerifierModule,
    KeyModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
