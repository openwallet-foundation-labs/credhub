import {
  AuthenticationExtensionsClientOutputs,
  AuthenticatorAttachment,
  AuthenticatorAttestationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

export class RegistrationResponse implements RegistrationResponseJSON {
  id: string;
  rawId: string;
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: 'public-key';
}
