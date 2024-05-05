import { RP } from '@sphereon/did-auth-siop';
import { PresentationDefinitionV2 } from '@sphereon/pex-models';

/**
 * The RP instance.
 */
export interface RPInstance {
  rp: RP;
  verifier: VerifierRP;
}

/**
 * Information about the RP.
 */
export interface Metadata {
  clientId: string;
  clientName: string;
  logo_uri: string;
}

/**
 * The RP verifier.
 */
export interface VerifierRP {
  metadata: Metadata;
  request: PresentationDefinitionV2;
}
