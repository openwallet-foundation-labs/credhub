import {
  OP,
  type PresentationDefinitionWithLocation,
  PresentationExchange,
  type VerifiedAuthorizationRequest,
} from '@sphereon/did-auth-siop';

export interface Session {
  user: string;
  verifiedAuthReqWithJWT: VerifiedAuthorizationRequest;
  created: Date;
  pex: PresentationExchange;
  op: OP;
  pd: PresentationDefinitionWithLocation;
}
