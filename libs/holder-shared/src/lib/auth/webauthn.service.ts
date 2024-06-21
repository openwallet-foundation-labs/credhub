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
import {
  AuthApiService,
  RegistrationResponse,
  AuthenticationResponse,
} from '../api';

@Injectable({ providedIn: 'root' })
export class WebauthnService {
  constructor(private authService: AuthApiService) {}

  async register() {
    const res = (await firstValueFrom(
      this.authService.webAuthnControllerGetRegistrationOptions()
    )) as PublicKeyCredentialCreationOptionsJSON;
    console.log(res);
    const registrationResponse = await startRegistration(res);
    console.log(registrationResponse);
    await firstValueFrom(
      this.authService.webAuthnControllerVerifyRegistration(
        registrationResponse as RegistrationResponse
      )
    );
  }

  async authenticate() {
    const res = (await firstValueFrom(
      this.authService.webAuthnControllerGetAuthenticationOptions()
    )) as PublicKeyCredentialRequestOptionsJSON;
    const authResponse = await startAuthentication(res);
    await firstValueFrom(
      this.authService.webAuthnControllerVerifyAuthentication(
        authResponse as AuthenticationResponse
      )
    );
  }
}
