import {
  CredentialConfigurationSupportedV1_0_13,
  CredentialDefinitionV1_0_13,
  CredentialsSupportedDisplay,
  IssuerCredentialSubject,
  KeyProofType,
  OID4VCICredentialFormat,
  ProofType,
} from '@sphereon/oid4vci-common';
import { CredentialSchema } from '../../issuer/types';
import { DisclosureFrame } from '@sd-jwt/types';

//TODO: to get full openapi support, we need to implement all types and interfaces
export class CredentialConfigurationSupportedV1_0_13Dto
  implements CredentialConfigurationSupportedV1_0_13
{
  [x: string]: unknown;
  credential_definition: CredentialDefinitionV1_0_13;
  vct?: string;
  id?: string;
  claims?: IssuerCredentialSubject;
  format: OID4VCICredentialFormat;
  scope?: string;
  cryptographic_binding_methods_supported?: string[];
  credential_signing_alg_values_supported?: string[];
  proof_types_supported?: Record<KeyProofType, ProofType>;
  display?: CredentialsSupportedDisplay[];
}

export class Template implements CredentialSchema {
  schema: CredentialConfigurationSupportedV1_0_13;
  sd: DisclosureFrame<Record<string, unknown | boolean>>;
  ttl: number;
}
