import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { Credential } from './entities/credential.entity';
import { HttpModule } from '@nestjs/axios';
import { CryptoModule, ResolverModule } from '@credhub/backend';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential]),
    HttpModule,
    ResolverModule,
    CryptoModule,
  ],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
