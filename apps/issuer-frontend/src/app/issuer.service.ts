import { Injectable } from '@angular/core';
import { ConfigService } from './config/config.service';
import { firstValueFrom } from 'rxjs';
import { SessionsApiService } from '@credhub/issuer-shared';

export interface SessionCreationResponse {
  uri: string;
  session: {
    preAuthorizedCode: string;
  };
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssuerService {
  loop?: NodeJS.Timer;
  status?: string;
  uri?: string;

  constructor(
    private sessionApiService: SessionsApiService,
    private configService: ConfigService
  ) {}

  /**
   * Gets the url for a new session from the issuer
   */
  async getUrl() {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.sessionApiService.issuerControllerRequest({
        credentialId: this.configService.getConfig('credentialId'),
        credentialSubject: {
          prename: 'Max',
          surname: 'Mustermann',
        },
        pin: false,
      })
    );
    this.loop = setInterval(() => this.getStatus(res.id), 2000);
    this.uri = res.uri;
  }

  async getStatus(id: string) {
    const response = await firstValueFrom(
      this.sessionApiService.issuerControllerGetSession(id)
    );
    this.status = response.status;
    if (this.status === 'CREDENTIAL_ISSUED') clearInterval(this.loop);
  }
}
