import { ConfigService } from '@nestjs/config';
import { ES256 } from '@sd-jwt/crypto-nodejs';
import { ED25519 } from './ed25519';
import { CryptoImplementation } from './crypto-implementation';
import { Injectable } from '@nestjs/common';

export type CryptoType = 'ES256' | 'Ed25519';

@Injectable()
export class CryptoService {
  constructor(private configServie: ConfigService) {}

  getAlg(): CryptoType {
    return this.configServie.get('CRYPTO_ALG') as CryptoType;
  }

  getCrypto(
    alg = this.configServie.get<string>('CRYPTO_ALG')
  ): CryptoImplementation {
    switch (alg) {
      case 'Ed25519':
        return ED25519;
      case 'ES256':
        return ES256;
      default:
        throw new Error(`Unsupported algorithm ${alg}`);
    }
  }
}
