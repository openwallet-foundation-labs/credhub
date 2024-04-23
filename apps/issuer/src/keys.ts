import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ES256 } from '@sd-jwt/crypto-nodejs';
import { JWK } from 'jose';
import { v4 } from 'uuid';

/**
 * Get the keys for the issuer. If the keys do not exist, they are generated and saved to the file system.
 * @returns The private and public keys.
 */
export async function getKeys() {
  let privateKey: JWK;
  let publicKey: JWK;
  const folder = './tmp';
  if (!existsSync(folder)) {
    mkdirSync(folder);
  }
  if (!existsSync(`${folder}`)) {
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
