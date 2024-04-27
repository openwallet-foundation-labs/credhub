import { Credential } from '../entities/credential.entity';

export class CredentialResponse extends Credential {
  credential: Record<string, unknown>;
}
