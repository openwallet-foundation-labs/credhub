import { DynamicModule, Global, Module } from '@nestjs/common';
import { FileSystemKeyService } from './filesystem-key.service';
import * as Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { VaultKeyService } from './vault-key.service';
import { CryptoService } from '../crypto/crypto.service';
import { CryptoModule } from '../crypto/crypto.module';

export const KEY_VALIDATION_SCHEMA = {
  KM_TYPE: Joi.string().valid('file', 'vault').default('file'),
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
  VAULT_KEY_ID: Joi.string().when('KM_TYPE', {
    is: 'vault',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  KM_FOLDER: Joi.string().when('KM_TYPE', {
    is: 'file',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
};
@Global()
@Module({})
export class KeyModule {
  static forRoot(): DynamicModule {
    return {
      module: KeyModule,
      imports: [HttpModule, ConfigModule, CryptoModule],
      providers: [
        {
          provide: 'KeyService',
          useFactory: (
            configService: ConfigService,
            httpService: HttpService,
            cryptoService: CryptoService
          ) => {
            const kmType = configService.get<string>('KM_TYPE');
            return kmType === 'vault'
              ? new VaultKeyService(httpService, configService, cryptoService)
              : new FileSystemKeyService(configService, cryptoService);
          },
          inject: [ConfigService, HttpService, CryptoService],
        },
      ],
      exports: ['KeyService'],
    };
  }
}
