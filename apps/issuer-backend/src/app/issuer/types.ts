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
