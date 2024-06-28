import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule, OIDC_VALIDATION_SCHEMA } from './auth/auth.module';
import { CredentialsModule } from './credentials/credentials.module';
import { DB_VALIDATION_SCHEMA, DbModule } from './db/db.module';
import { KEY_VALIDATION_SCHEMA, KeysModule } from './keys/keys.module';
import { Oid4vcModule } from './oid4vc/oid4vc.module';
import { HistoryModule } from './history/history.module';
import { AppController } from './app.controller';
import { SettingsModule } from './settings/settings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WEBAUTHN_VALIDATION_SCHEMA } from './auth/webauthn/webauthn.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        ...OIDC_VALIDATION_SCHEMA,
        ...WEBAUTHN_VALIDATION_SCHEMA,
        ...KEY_VALIDATION_SCHEMA,
        ...DB_VALIDATION_SCHEMA,
      }),
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    DbModule,
    KeysModule.forRoot(),
    CredentialsModule,
    Oid4vcModule,
    HistoryModule,
    SettingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
