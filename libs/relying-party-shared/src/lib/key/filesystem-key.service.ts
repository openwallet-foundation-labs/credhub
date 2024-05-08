import { ES256 } from '@sd-jwt/crypto-nodejs';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import {
  JWK,
  JWTHeaderParameters,
  JWTPayload,
  KeyLike,
  SignJWT,
  importJWK,
} from 'jose';
import { v4 } from 'uuid';
import { KeyService } from './key.service';
import { Injectable } from '@nestjs/common';
import { Signer } from '@sd-jwt/types';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';

//TODO: implement a vault integration like in the backend
/**
 * The key service is responsible for managing the keys of the issuer.
 */
@Injectable()
export class FileSystemKeyService implements KeyService {
  public signer!: Signer;
  private privateKey!: JWK;
  private publicKey!: JWK;
  private privateKeyInstance!: KeyLike;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.init();
    this.signer = await ES256.getSigner(this.privateKey);
    this.privateKeyInstance = (await importJWK(this.privateKey)) as KeyLike;
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
    const folder = join(this.configService.get('KM_FOLDER') as string, 'keys');
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
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
  getKid() {
    return Promise.resolve(this.publicKey.kid as string);
  }

  /**
   * Get the public key
   * @returns
   */
  getPublicKey() {
    const copy = { ...this.publicKey };
    copy.key_ops = undefined;
    copy.ext = undefined;
    return Promise.resolve(copy);
  }

  async signJWT(payload: JWTPayload, header: JWTHeaderParameters) {
    return new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(this.privateKeyInstance);
  }
}
