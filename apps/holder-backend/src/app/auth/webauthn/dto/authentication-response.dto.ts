import {
  AuthenticationExtensionsClientOutputs,
  AuthenticationResponseJSON,
  AuthenticatorAssertionResponseJSON,
  AuthenticatorAttachment,
} from '@simplewebauthn/types';

export class AuthenticationResponse implements AuthenticationResponseJSON {
  id: string;
  rawId: string;
  response: AuthenticatorAssertionResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: 'public-key';
}
