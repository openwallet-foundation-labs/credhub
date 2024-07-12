/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { CredentialDefinitionV1013 } from './credentialDefinitionV1013';
import { CredentialsSupportedDisplay } from './credentialsSupportedDisplay';


export interface CredentialConfigurationSupportedV1013 { 
    credential_definition: CredentialDefinitionV1013;
    vct: string;
    id: string;
    claims?: object;
    format: object;
    scope?: string;
    cryptographic_binding_methods_supported?: Array<string>;
    credential_signing_alg_values_supported?: Array<string>;
    proof_types_supported?: object;
    display?: Array<CredentialsSupportedDisplay>;
}

