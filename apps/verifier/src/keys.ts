import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ES256 } from '@sd-jwt/crypto-nodejs';
import axios from 'axios';
import { JWK } from 'jose';

/**
 * Get the keys for the issuer. If the keys do not exist, they are generated and saved to the file system.
 * @returns The private and public keys.
 */
export async function getKeys() {
  let privateKey: JsonWebKey;
  let publicKey: JsonWebKey;
  const folder = 'tmp';
  if (!existsSync(folder)) {
    mkdirSync(folder);
  }
  if (!existsSync(`${folder}`)) {
    const keys = await ES256.generateKeyPair();
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
    writeFileSync(`${folder}/private.json`, JSON.stringify(privateKey));
    writeFileSync(`${folder}/public.json`, JSON.stringify(publicKey));
  } else {
    privateKey = JSON.parse(readFileSync(`${folder}/private.json`, 'utf-8'));
    publicKey = JSON.parse(readFileSync(`${folder}/public.json`, 'utf-8'));
  }
  return { privateKey, publicKey };
}

interface IssuerMetadata {
  issuer: string;
  jwks: {
    keys: JWK[];
  };
}

export async function getPublicKey(issuer: string, kid: string): Promise<JWK> {
  const response = await axios
    .get<IssuerMetadata>(`${issuer}/.well-known/jwt-vc-issuer`)
    .then((r) => r.data);
  const key = response.jwks.keys.find((key) => key.kid === kid);
  if (!key) {
    throw new Error('Key not found');
  }
  return key;
}
