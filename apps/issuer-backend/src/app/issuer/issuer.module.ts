import { Module, OnModuleInit } from '@nestjs/common';
import { IssuerDataService } from './issuer-data.service';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { WellKnownController } from './well-known/well-known.controller';
import { CredentialsModule } from '../credentials/credentials.module';
import { StatusModule } from '../status/status.module';
import { TemplatesModule } from '../templates/templates.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CNonceEntity } from './entities/c-nonce.entity';
import { URIStateEntity } from './entities/uri-state.entity';
import { CredentialOfferSessionEntity } from './entities/credential-offer-session.entity';

@Module({
  imports: [
    CredentialsModule,
    StatusModule,
    TemplatesModule,
    TypeOrmModule.forFeature([
      CNonceEntity,
      URIStateEntity,
      CredentialOfferSessionEntity,
    ]),
  ],
  controllers: [IssuerController, WellKnownController],
  providers: [IssuerService, IssuerDataService],
})
export class IssuerModule implements OnModuleInit {
  constructor(
    private issuerDataService: IssuerDataService,
    private issuerService: IssuerService
  ) {}

  async onModuleInit() {
    await this.issuerDataService.loadConfig();
    await this.issuerService.init();
  }
}
