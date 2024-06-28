import { Injectable, NgZone } from '@angular/core';
import { OpenID4VCIClient } from '@sphereon/oid4vci-client';
import {
  CredentialConfigurationSupported,
  CredentialsSupportedDisplay,
  MetadataDisplay,
} from '@sphereon/oid4vci-common';
import { Oid4vciApiService, Oid4vcpApiService } from '@credhub/holder-shared';
import { firstValueFrom } from 'rxjs';

export interface ResultScan {
  action: 'issue' | 'verify';
  client?: OpenID4VCIClient;
  url: string;
  sessionId?: string;
  relyingParty: string;
  credentials?: CredentialConfigurationSupported[];
  purpose?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  results: ResultScan[] = [];

  constructor(
    private zone: NgZone,
    private oid4vciApiService: Oid4vciApiService,
    private oid4vpApiService: Oid4vcpApiService
  ) {
    // this.listenToEvents();
  }

  listenToEvents() {
    console.log('listen');
    chrome.runtime.onMessage.addListener((request) => {
      console.log(request);
      if (request.action === 'addQRCode') {
        this.parse(request.data);
      }
    });
  }

  async parse(url: string) {
    if (url.startsWith('openid-credential-offer')) {
      const result = await firstValueFrom(
        this.oid4vciApiService.oid4vciControllerParse({
          url,
          noSession: true,
        })
      );
      this.zone.run(() => {
        this.results.push({
          action: 'issue',
          url,
          credentials: result.credentials as CredentialConfigurationSupported[],
          sessionId: result.sessionId,
          relyingParty: (result.issuer[0] as MetadataDisplay).name as string,
        });
      });
    } else {
      const result = await firstValueFrom(
        this.oid4vpApiService.oid4vpControllerParse({ url, noSession: true })
      );
      this.zone.run(() => {
        this.results.push({
          action: 'verify',
          url,
          sessionId: result.sessionId,
          purpose: result.purpose,
          relyingParty: result.rp.name,
        });
      });
    }
  }

  getNames(credentials: CredentialConfigurationSupported[]) {
    return credentials
      .map(
        (credential) =>
          (credential.display as CredentialsSupportedDisplay[])[0].name
      )
      .join(', ');
  }
}
