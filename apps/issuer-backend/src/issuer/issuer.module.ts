import { Module } from '@nestjs/common';
import { IssuerDataService } from './issuer-data.service';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { CredentialsModule } from 'src/credentials/credentials.module';
import { WellKnownController } from './well-known/well-known.controller';

@Module({
  imports: [CredentialsModule],
  controllers: [IssuerController, WellKnownController],
  providers: [IssuerService, IssuerDataService],
})
export class IssuerModule {}
