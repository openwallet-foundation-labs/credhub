import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { Credential } from './entities/credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Credential])],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
