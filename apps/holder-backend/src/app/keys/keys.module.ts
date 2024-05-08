import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Key } from './entities/key.entity';
import { DbKeysService } from './db-keys.service';
import { VaultKeysService } from './vault-keys.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { DataSource } from 'typeorm';

export const KEY_VALIDATION_SCHEMA = {
  KM_TYPE: Joi.string().valid('db', 'vault').default('db'),
  VAULT_URL: Joi.string().when('KM_TYPE', {
    is: 'vault',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VAULT_TOKEN: Joi.string().when('KM_TYPE', {
    is: 'vault',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
};
@Global()
@Module({})
export class KeysModule {
  static forRootSync(): DynamicModule {
    return {
      module: KeysModule,
      imports: [TypeOrmModule.forFeature([Key]), HttpModule, ConfigModule],
      providers: [
        {
          provide: 'KeyService',
          useFactory: (
            configService: ConfigService,
            httpService: HttpService,
            dataSource: DataSource
          ) => {
            const kmType = configService.get<string>('KM_TYPE');
            return kmType === 'vault'
              ? new VaultKeysService(httpService, configService)
              : new DbKeysService(dataSource.getRepository(Key));
          },
          inject: [ConfigService, HttpService, DataSource],
        },
      ],
      exports: ['KeyService'],
    };
  }
}
