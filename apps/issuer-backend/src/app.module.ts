import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { KeyModule } from './key/key.module';
import { IssuerModule } from './issuer/issuer.module';
import { DB_VALIDATION_SCHEMA, DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { CredentialsModule } from './credentials/credentials.module';

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
        ...DB_VALIDATION_SCHEMA,
      }),
    }),
    KeyModule,
    IssuerModule,
    AuthModule,
    DbModule,
    CredentialsModule,
  ],
  controllers: [AppController],  
})
export class AppModule {}
