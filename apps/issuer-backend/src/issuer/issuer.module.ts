import { Module } from '@nestjs/common';
import { IssuerDataService } from './issuer-data.service';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { KeyModule } from 'src/key/key.module';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { WellKnownController } from './well-known/well-known.controller';

@Module({
  imports: [KeyModule, CredentialsModule],
  controllers: [IssuerController, WellKnownController],
  providers: [IssuerService, IssuerDataService],
})
export class IssuerModule {}
