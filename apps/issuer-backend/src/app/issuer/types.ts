import { DisclosureFrame } from '@sd-jwt/types';
import { CredentialConfigurationSupportedV1_0_13 } from '@sphereon/oid4vci-common';
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
  schema: CredentialConfigurationSupportedV1_0_13;
  sd: DisclosureFrame<Record<string, unknown | boolean>>;
  // time to live in seconds, it will be added on the current time to get the expiration time.
  ttl?: number;
}
