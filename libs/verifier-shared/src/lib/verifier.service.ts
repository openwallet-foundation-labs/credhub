import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SiopApiService } from './api';
import { ConfigBasic, ConfigService } from '@credhub/relying-party-frontend';

export class VerifierConfig extends ConfigBasic {
  backendUrl!: string;
  credentialId!: string;
}

@Injectable({
  providedIn: 'root',
})
export class VerifierService {
  private loop?: ReturnType<typeof setInterval>;
  statusEvent: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private siopApiService: SiopApiService,
    private configService: ConfigService<VerifierConfig>
  ) {}

  /**
   * Gets the url for a new session from the issuer
   */
  async getUrl(): Promise<string> {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.siopApiService.verifierControllerCreateSession(
        this.configService.getConfig('credentialId')
      )
    );
    const id = decodeURIComponent(res.uri).split('/').pop() as string;
    this.loop = setInterval(() => this.getStatus(id), 2000);
    return res.uri;
  }

  async getStatus(id: string) {
    await firstValueFrom(
      this.siopApiService.verifierControllerGetAuthRequestStatus(
        this.configService.getConfig('credentialId'),
        id
      )
    ).then(
      (response) => {
        if (this.statusEvent.value !== response.status) {
          this.statusEvent.next(response.status);
        }
        if (response.status === 'verified') clearInterval(this.loop);
      },
      (err) => {
        console.error(err);
        clearInterval(this.loop);
      }
    );
  }

  stop() {
    clearInterval(this.loop);
  }
}
