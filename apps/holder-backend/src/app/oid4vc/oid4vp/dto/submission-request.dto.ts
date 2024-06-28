import { AuthenticationResponseJSON } from '@simplewebauthn/types';

export class CredentialSelection {
  [key: string]: string;
}

export class SubmissionRequest {
  auth?: {
    session: string;
    response: AuthenticationResponseJSON;
  };
  values: CredentialSelection;
}
