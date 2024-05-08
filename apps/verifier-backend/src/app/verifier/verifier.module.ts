import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { VerifierController } from './verifier.controller';
import { KeyModule } from '../key/key.module';

@Module({
  imports: [KeyModule],
  controllers: [VerifierController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
