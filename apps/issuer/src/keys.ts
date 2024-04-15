import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ES256 } from '@sd-jwt/crypto-nodejs';

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
  if (!existsSync(`${folder}/keys`)) {
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
