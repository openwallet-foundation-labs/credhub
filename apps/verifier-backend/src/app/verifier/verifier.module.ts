import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { SiopController } from './siop.controller';
import { ResolverModule } from '../resolver/resolver.module';
import { HttpModule } from '@nestjs/axios';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [ResolverModule, HttpModule, TemplatesModule],
  controllers: [SiopController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
