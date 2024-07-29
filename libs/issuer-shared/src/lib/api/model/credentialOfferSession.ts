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


export interface CredentialOfferSession { 
    id: string;
    clientId?: string;
    credentialOffer: object;
    credentialDataSupplierInput?: object;
    userPin?: string;
    status: CredentialOfferSession.StatusEnum;
    error?: string;
    lastUpdatedAt: number;
    notification_id: string;
    issuerState?: string;
    preAuthorizedCode?: string;
    createdAt: number;
}
export namespace CredentialOfferSession {
    export type StatusEnum = 'OFFER_CREATED' | 'OFFER_URI_RETRIEVED' | 'ACCESS_TOKEN_REQUESTED' | 'ACCESS_TOKEN_CREATED' | 'CREDENTIAL_REQUEST_RECEIVED' | 'CREDENTIAL_ISSUED' | 'ERROR';
    export const StatusEnum = {
        OFFER_CREATED: 'OFFER_CREATED' as StatusEnum,
        OFFER_URI_RETRIEVED: 'OFFER_URI_RETRIEVED' as StatusEnum,
        ACCESS_TOKEN_REQUESTED: 'ACCESS_TOKEN_REQUESTED' as StatusEnum,
        ACCESS_TOKEN_CREATED: 'ACCESS_TOKEN_CREATED' as StatusEnum,
        CREDENTIAL_REQUEST_RECEIVED: 'CREDENTIAL_REQUEST_RECEIVED' as StatusEnum,
        CREDENTIAL_ISSUED: 'CREDENTIAL_ISSUED' as StatusEnum,
        ERROR: 'ERROR' as StatusEnum
    };
}


