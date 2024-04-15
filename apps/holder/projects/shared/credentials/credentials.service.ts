import { Injectable } from '@angular/core';
import { getHasher } from '@sd-jwt/crypto-browser';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';

@Injectable({
  providedIn: 'root',
})
export class CredentialsService {
  instance: SDJwtVcInstance;
  constructor() {
    this.instance = new SDJwtVcInstance({ hasher: getHasher() });
  }
}
