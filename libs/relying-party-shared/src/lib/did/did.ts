import { DIDResolutionResult, Resolvable } from 'did-resolver';
import { type JWK } from 'jose';

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
 * Resolve a did document for a did:jwk
 */
export class JWkResolver implements Resolvable {
  resolve(didUrl: string): Promise<DIDResolutionResult> {
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
