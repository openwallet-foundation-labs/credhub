import { DynamicModule, Global, Module } from '@nestjs/common';
import { FileSystemKeyService } from './filesystem-key.service';
import Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { VaultKeyService } from './vault-key.service';

export const KEY_VALIDATION_SCHEMA = {
  KM_TYPE: Joi.string().valid('db', 'vault').default('db'),
  VAULT_URL: Joi.string().when('KM_TYPE', {
    is: 'vault',
    // biome-ignore lint/suspicious/noThenProperty: <explanation>
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VAULT_TOKEN: Joi.string().when('KM_TYPE', {
    is: 'vault',
    // biome-ignore lint/suspicious/noThenProperty: <explanation>
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
};
@Global()
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class KeyModule {
  static forRootSync(): DynamicModule {
    return {
      module: KeyModule,
      imports: [HttpModule, ConfigModule],
      providers: [
        {
          provide: 'KeyService',
          useFactory: (
            configService: ConfigService,
            httpService: HttpService
          ) => {
            const kmType = configService.get<string>('KM_TYPE');
            return kmType === 'vault'
              ? new VaultKeyService(httpService, configService)
              : new FileSystemKeyService();
          },
          inject: [ConfigService, HttpService],
        },
      ],
      exports: ['KeyService'],
    };
  }
}
