import { Injectable, NgZone } from '@angular/core';
import { OpenID4VCIClient } from '@sphereon/oid4vci-client';
import {
  CredentialSupported,
  CredentialsSupportedDisplay,
} from '@sphereon/oid4vci-common';
import { Oid4vciApiService, Oid4vcpApiService } from '../api/kms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

export interface ResultScan {
  action: 'issue' | 'verify';
  client?: OpenID4VCIClient;
  sessionId?: string;
  relyingParty: string;
  credentials: CredentialSupported[];
}

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  results: ResultScan[] = [];

  constructor(
    private zone: NgZone,
    private oid4vciApiService: Oid4vciApiService,
    private oid4vpApiService: Oid4vcpApiService,
    private router: Router
  ) {}

  async parse(url: string) {
    if (url.startsWith('openid-credential-offer')) {
      const result = await firstValueFrom(
        this.oid4vciApiService.oid4vciControllerParse({
          url,
        })
      );
      this.zone.run(() => {
        this.results.push({
          action: 'issue',
          credentials: result.credentials as CredentialSupported[],
          sessionId: result.sessionId,
          relyingParty: result.relyingParty,
        });
      });
    } else {
      const result = await firstValueFrom(
        this.oid4vpApiService.oid4vpControllerParse({ url })
      );
      console.log(result);
    }
  }

  async accept(data: ResultScan) {
    const result = await firstValueFrom<{ id: string }>(
      this.oid4vciApiService.oid4vciControllerAccept(data.sessionId as string)
    );

    this.router.navigate(['/credentials', result.id]);
  }

  getNames(credentials: CredentialSupported[]) {
    return credentials
      .map(
        (credential) =>
          (credential.display as CredentialsSupportedDisplay[])[0].name
      )
      .join(', ');
  }
}
