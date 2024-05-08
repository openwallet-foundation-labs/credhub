import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from './config/config.service';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  'not-before-policy': number;
  scope: string;
}

export interface SessionCreationResponse {
  uri: string;
}

export interface SessionStatusResponse {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class VerifierService {
  private accessToken?: string;
  loop?: NodeJS.Timer;
  status?: string;
  uri?: string;

  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService
  ) {
    this.authenticateWithKeycloak();
  }

  private async authenticateWithKeycloak() {
    const body = `grant_type=client_credentials&client_id=${this.configService.getConfig(
      'clientId'
    )}&client_secret=${this.configService.getConfig('clientSecret')}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const response = await firstValueFrom(
      this.httpClient.post<AuthResponse>(
        this.configService.getConfig('tokenEndpoint'),
        body,
        { headers }
      )
    );

    this.accessToken = response.access_token;
    // refresh the token before it expires
    setTimeout(
      () => this.authenticateWithKeycloak(),
      (response.expires_in - 10) * 1000
    );
  }

  /**
   * Gets the url for a new session from the issuer
   */
  async getUrl() {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.httpClient.post<SessionCreationResponse>(
        `${this.configService.getConfig(
          'verifierUrl'
        )}/siop/${this.configService.getConfig('credentialId')}`,
        {},
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${this.accessToken}`,
          }),
        }
      )
    );
    const id = decodeURIComponent(res.uri).split('/').pop() as string;
    this.loop = setInterval(() => this.getStatus(id), 2000);
    this.uri = res.uri;
  }

  async getStatus(id: string) {
    const response = await firstValueFrom(
      this.httpClient.get<SessionStatusResponse>(
        `${this.configService.getConfig(
          'verifierUrl'
        )}/siop/${this.configService.getConfig(
          'credentialId'
        )}/auth-request/${id}/status`,
        {
          headers: new HttpHeaders({
            Authorization: `Bearer ${this.accessToken}`,
          }),
        }
      )
    );
    this.status = response.status;
    if (this.status === 'completed') clearInterval(this.loop);
  }
}
