import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { DatabaseType } from 'typeorm';

export const DB_VALIDATION_SCHEMA = {
  DB_TYPE: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
  DB_HOST: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  DB_PORT: Joi.number().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  DB_USERNAME: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  DB_PASSWORD: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  DB_NAME: Joi.string().required(),
};

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        switch (configService.get('DB_TYPE') as DatabaseType) {
          case 'sqlite':
            return {
              type: 'sqlite',
              database: configService.get('DB_NAME'),
              synchronize: true,
              autoLoadEntities: true,
            } as TypeOrmModuleOptions;
          case 'postgres':
            return {
              type: 'postgres',
              host: configService.get('DB_HOST'),
              port: configService.get('DB_PORT'),
              username: configService.get('DB_USERNAME'),
              password: configService.get('DB_PASSWORD'),
              database: configService.get('DB_NAME'),
              synchronize: true,
              autoLoadEntities: true,
            } as TypeOrmModuleOptions;
          default:
            throw new Error('Invalid DB_TYPE');
        }
      },
    }),
  ],
})
export class DbModule {}
