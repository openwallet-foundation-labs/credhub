import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SessionResponseDto, SessionsApiService } from './api';
import { IssuerConfigService } from './issuer-config.service';

type IssuanceConfig = {
  pin: boolean;
};

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
  private loop?: ReturnType<typeof setInterval>;
  statusEvent: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private sessionApiService: SessionsApiService,
    private configService: IssuerConfigService
  ) {}

  /**
   * Gets the url for a new session from the issuer and returns it.
   */
  async getUrl(
    credentialId: string = this.configService.getConfig('credentialId'),
    credentialSubject: Record<string, unknown>,
    config: IssuanceConfig
  ): Promise<SessionResponseDto> {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.sessionApiService.issuerControllerRequest({
        credentialId,
        credentialSubject,
        ...config,
      })
    );
    this.loop = setInterval(() => this.getStatus(res.id), 2000);
    return res;
  }

  /**
   * Gets the status of a session by id and updates the statusEvent.
   * @param id
   */
  async getStatus(id: string) {
    await firstValueFrom(
      this.sessionApiService.issuerControllerGetSession(id)
    ).then(
      (response) => {
        if (this.statusEvent.value !== response.status) {
          this.statusEvent.next(response.status);
        }
        if (response.status === 'CREDENTIAL_ISSUED') clearInterval(this.loop);
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
