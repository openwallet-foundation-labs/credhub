import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SiopApiService } from './api';
import { VerifierConfigService } from './verifier-config.service';

@Injectable({
  providedIn: 'root',
})
export class VerifierService {
  private loop?: ReturnType<typeof setInterval>;
  statusEvent: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private siopApiService: SiopApiService) {}

  getRequest(credentialId: string) {
    return firstValueFrom(
      this.siopApiService.siopControllerCreateSession(credentialId)
    ).then((res) => res.id);
  }

  /**
   * Gets the url for a new session from the issuer
   */
  async getUrl(credentialId: string): Promise<string> {
    if (this.loop) clearInterval(this.loop);
    const res = await firstValueFrom(
      this.siopApiService.siopControllerCreateSession(credentialId)
    );
    const id = decodeURIComponent(res.uri).split('/').pop() as string;
    this.loop = setInterval(() => this.getStatus(credentialId, id), 2000);
    return res.uri;
  }

  async getStatus(credentialId: string, id: string) {
    await firstValueFrom(
      this.siopApiService.siopControllerGetAuthRequestStatus(credentialId, id)
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
