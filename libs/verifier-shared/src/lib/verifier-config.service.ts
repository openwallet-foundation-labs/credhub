import { Injectable } from '@angular/core';
import { ConfigBasic, ConfigService } from '@credhub/relying-party-frontend';

@Injectable({
  providedIn: 'root',
})
export class VerifierConfigService extends ConfigService<VerifierConfig> {
  override path = '/assets/verifier-config.json';
}
export class VerifierConfig extends ConfigBasic {
  backendUrl!: string;
  credentialId!: string;
}
