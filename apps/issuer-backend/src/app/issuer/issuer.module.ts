import { Module } from '@nestjs/common';
import { IssuerDataService } from './issuer-data.service';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { WellKnownController } from './well-known/well-known.controller';
import { CredentialsModule } from '../credentials/credentials.module';
import { StatusModule } from '../status/status.module';
import { CryptoModule } from '@credhub/relying-party-shared';

@Module({
  imports: [CredentialsModule, StatusModule, CryptoModule],
  controllers: [IssuerController, WellKnownController],
  providers: [IssuerService, IssuerDataService],
})
export class IssuerModule {}
