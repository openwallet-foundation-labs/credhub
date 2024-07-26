import { DIDResolutionResult, Resolvable } from 'did-resolver';

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
