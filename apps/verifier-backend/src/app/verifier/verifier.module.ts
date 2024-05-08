import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { VerifierController } from './verifier.controller';
import { ResolverModule } from '../resolver/resolver.module';

@Module({
  imports: [ResolverModule],
  controllers: [VerifierController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
