import { DisclosureFrame } from '@sd-jwt/types';
import { CredentialSupported } from '@sphereon/oid4vci-common';
import { JWK } from 'jose';

/**
 * The metadata of the issuer.
 */
export interface IssuerMetadata {
  issuer: string;
  jwks_uri?: string;
  jwks?: {
    keys: JWK[];
  };
}

/**
 * The schema of the credential.
 */
export interface CredentialSchema {
  schema: CredentialSupported;
  sd: DisclosureFrame<object>;
}
