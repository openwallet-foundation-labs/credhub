import { Injectable } from '@angular/core';
import { ConfigBasic, ConfigService } from '@credhub/relying-party-frontend';

@Injectable({
  providedIn: 'root',
})
export class IssuerConfigService extends ConfigService<IssuerConfig> {
  override path = '/assets/issuer-config.json';
}
export class IssuerConfig extends ConfigBasic {
  backendUrl!: string;
  credentialId!: string;
}
