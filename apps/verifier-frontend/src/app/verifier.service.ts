import { Injectable } from '@angular/core';
import { ConfigService } from './config/config.service';
import { firstValueFrom } from 'rxjs';
import { SiopApiService } from '@my-wallet/verifier-shared';

@Injectable({
  providedIn: 'root',
})
export class VerifierService {
  loop?: NodeJS.Timer;
  status?: string;
  uri?: string;

  constructor(
    private siopApiService: SiopApiService,
    private configService: ConfigService
  ) {}

  /**
   * Gets the url for a new session from the issuer
   */
  async getUrl() {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.siopApiService.verifierControllerCreateSession(
        this.configService.getConfig('credentialId')
      )
    );
    const id = decodeURIComponent(res.uri).split('/').pop() as string;
    this.loop = setInterval(() => this.getStatus(id), 2000);
    this.uri = res.uri;
  }

  async getStatus(id: string) {
    const response = await firstValueFrom(
      this.siopApiService.verifierControllerGetAuthRequestStatus(
        this.configService.getConfig('credentialId'),
        id
      )
    );

    this.status = response.status;
    if (this.status === 'completed') clearInterval(this.loop);
  }
}
