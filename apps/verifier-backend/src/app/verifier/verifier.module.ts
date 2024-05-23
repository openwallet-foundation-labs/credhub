import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { VerifierController } from './verifier.controller';
import { ResolverModule } from '../resolver/resolver.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ResolverModule, HttpModule],
  controllers: [VerifierController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
