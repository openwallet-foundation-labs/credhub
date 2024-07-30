import {
  CredentialOfferSession as ICredentialOfferSession,
  AssertedUniformCredentialOffer,
  IssueStatus,
} from '@sphereon/oid4vci-common';

export class CredentialOfferSession implements ICredentialOfferSession {
  id: string;
  clientId?: string;
  credentialOffer: AssertedUniformCredentialOffer;
  credentialDataSupplierInput?: unknown;
  userPin?: string;
  status: IssueStatus;
  error?: string;
  lastUpdatedAt: number;
  notification_id: string;
  issuerState?: string;
  preAuthorizedCode?: string;
  createdAt: number;
}
