import {
  DIDResolutionOptions,
  DIDResolutionResult,
  Resolvable,
} from 'did-resolver';
import { type JWK, importJWK } from 'jose';

/**
 * Decodes a DID JWK to a public key
 * @param did
 * @returns Json Web Key as JWK
 */
export function decodeDidJWK(did: string) {
  return JSON.parse(
    Buffer.from(did.split('#')[0].split(':')[2], 'base64url').toString()
  ) as JWK;
}

/**
 * Encodes a public key as a DID JWK.
 * @param key
 * @returns
 */
export function encodeDidJWK(key: JWK) {
  key.key_ops = undefined;
  key.ext = undefined;
  return `did:jwk:${Buffer.from(JSON.stringify(key)).toString('base64url')}`;
}

/**
 * Get the JWK from a DID and returns a key object.
 * @param did encoded as a did:jwk
 * @returns KeyLike object
 */
export function getJWK(did: string) {
  const jwk = decodeDidJWK(did);
  //We are only supoprting ES256 for now.
  return importJWK(jwk, 'ES256');
}
export class JWkResolver implements Resolvable {
  resolve(
    didUrl: string,
    options?: DIDResolutionOptions | undefined
  ): Promise<DIDResolutionResult> {
    return Promise.resolve({
      didDocument: {
        id: didUrl,
        verificationMethod: [
          {
            controller: didUrl,
            id: `${didUrl}#0`,
            type: 'JsonWebKey2020',
          },
        ],
      },
      didDocumentMetadata: {},
      didResolutionMetadata: {},
    });
  }
}
