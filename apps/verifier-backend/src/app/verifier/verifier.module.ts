import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { SiopController } from './siop.controller';
import { HttpModule } from '@nestjs/axios';
import { TemplatesModule } from '../templates/templates.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthStateEntity } from './entity/auth-state.entity';
import { ResolverModule } from '@credhub/backend';

@Module({
  imports: [
    ResolverModule,
    HttpModule,
    TemplatesModule,
    TypeOrmModule.forFeature([AuthStateEntity]),
  ],
  controllers: [SiopController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
