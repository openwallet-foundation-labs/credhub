import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { ES256 } from '@sd-jwt/crypto-nodejs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { JWK, JWTPayload } from 'jose';
import { v4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { encodeDidJWK } from 'src/verifier/did';
import { X509Certificate } from 'node:crypto';
import { Resolver } from 'did-resolver';
import web from 'web-did-resolver';

const webResolver = web.getResolver();
const resolver = new Resolver({
  ...webResolver,
});

interface IssuerMetadata {
  issuer: string;
  jwks: {
    keys: JWK[];
  };
}

//TODO: implement a vault integration like in the backend
/**
 * The key service is responsible for managing the keys of the issuer.
 */
@Injectable()
export class KeyService implements OnModuleInit {
  private privateKey: JWK;
  private publicKey: JWK;
  constructor(private httpService: HttpService) {
    this.init();
  }

  async onModuleInit() {
    await this.init();
  }

  async init() {
    // get the keys
    const { privateKey, publicKey } = await this.getKeys();
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  /**
   * Get the keys from the file system or generate them if they do not exist
   * @returns
   */
  private async getKeys() {
    let privateKey: JWK;
    let publicKey: JWK;
    const folder = './tmp';
    if (!existsSync(folder)) {
      mkdirSync(folder);
    }
    if (
      !existsSync(`${folder}/private.json`) &&
      !existsSync(`${folder}/public.json`)
    ) {
      const keys = await ES256.generateKeyPair();
      privateKey = keys.privateKey as JWK;
      publicKey = keys.publicKey as JWK;
      //add a random key id for reference
      publicKey.kid = v4();
      privateKey.kid = publicKey.kid;
      writeFileSync(`${folder}/private.json`, JSON.stringify(privateKey));
      writeFileSync(`${folder}/public.json`, JSON.stringify(publicKey));
    } else {
      privateKey = JSON.parse(readFileSync(`${folder}/private.json`, 'utf-8'));
      publicKey = JSON.parse(readFileSync(`${folder}/public.json`, 'utf-8'));
    }
    return { privateKey, publicKey };
  }

  getDid(): string {
    return encodeDidJWK(this.publicKey);
  }

  /**
   * Get the public key
   * @returns
   */
  getPublicKey(): JWK {
    const copy = { ...this.publicKey };
    copy.key_ops = undefined;
    copy.ext = undefined;
    return copy;
  }

  /**
   * Get the private key
   * @returns
   */
  getPrivateKey(): JWK {
    return this.privateKey;
  }

  /**
   * Resolve the public key from the issuer, the function will first check for the x5c header, then for the did document and finally for the issuer metadata.
   * @param payload
   * @param header
   * @returns
   */
  async resolvePublicKey(payload: JWTPayload, header: JWK): Promise<JWK> {
    if (header.x5c) {
      const cert = new X509Certificate(Buffer.from(header.x5c[0], 'base64'));
      //TODO: implement the validation of the certificate chain and also the comparison of the identifier
      if (cert.subject !== payload.iss) {
        throw new Error('Subject and issuer do not match');
      }
      return cert.publicKey.export({ format: 'jwk' }) as JWK;
    }
    if (payload.iss.startsWith('did:')) {
      const did = await resolver.resolve(payload.iss);
      if (!did) {
        throw new ConflictException('DID not found');
      }
      //TODO: header.kid can be relative or absolute, we need to handle this
      const key = did.didDocument.verificationMethod.find(
        (vm) => vm.id === header.kid
      );
      if (!key) {
        throw new ConflictException('Key not found');
      }
      if (!key.publicKeyJwk) {
        throw new ConflictException(
          'Public key not found, we are only supporting JWK keys for now.'
        );
      }
      return key.publicKeyJwk;
    }

    // lets look for a did
    const response = await firstValueFrom(
      this.httpService.get<IssuerMetadata>(
        `${payload.iss}/.well-known/jwt-vc-issuer`
      )
    ).then(
      (r) => r.data,
      () => {
        throw new ConflictException('Issuer not reachable');
      }
    );
    const key = response.jwks.keys.find((key) => key.kid === header.kid);
    if (!key) {
      throw new Error('Key not found');
    }
    return key;
  }
}
