import { Injectable, OnModuleInit } from '@nestjs/common';
import { ES256 } from '@sd-jwt/crypto-nodejs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { JWK } from 'jose';
import { v4 } from 'uuid';

//TODO: implement a vault integration like in the backend
/**
 * The key service is responsible for managing the keys of the issuer.
 */
@Injectable()
export class KeyService implements OnModuleInit {
  private privateKey: JWK;
  private publicKey: JWK;
  constructor() {
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

  /**
   * Get the key id
   * @returns 
   */
  getKid(): string {
    return this.publicKey.kid;
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
}
