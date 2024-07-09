import { Injectable } from '@angular/core';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { firstValueFrom } from 'rxjs';
import {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import { AuthApiService, AuthSubmission, RegistrationResponse } from '../api';

@Injectable({ providedIn: 'root' })
export class WebauthnService {
  constructor(private authService: AuthApiService) {}

  /**
   * Register a new credential
   */
  async register() {
    const res = (await firstValueFrom(
      this.authService.webAuthnControllerGetRegistrationOptions()
    )) as PublicKeyCredentialCreationOptionsJSON;
    const registrationResponse = await startRegistration(res);
    await firstValueFrom(
      this.authService.webAuthnControllerVerifyRegistration(
        registrationResponse as RegistrationResponse
      )
    );
  }

  /**
   * Authenticate with a credential, use it to get a authenticated session for one action
   * @returns
   */
  async authenticate(): Promise<AuthSubmission> {
    const res = (await firstValueFrom(
      this.authService.webAuthnControllerGetAuthenticationOptions()
    )) as { options: PublicKeyCredentialRequestOptionsJSON; session: string };
    const authResponse = await startAuthentication(res.options);
    return {
      session: res.session,
      response: authResponse,
    };
  }

  /**
   * Check if the user has any keys to authenticate with
   * @returns
   */
  async hasKeys() {
    const keys = await this.getKeys();
    return keys.length > 0;
  }

  /**
   * Get all keys for the user
   * @returns
   */
  getKeys() {
    return firstValueFrom(this.authService.webAuthnControllerGetKeys());
  }

  /**
   * Delete a key
   * @param id
   * @returns
   */
  deleteKey(id: string) {
    return firstValueFrom(this.authService.webAuthnControllerDeleteKey(id));
  }
}
