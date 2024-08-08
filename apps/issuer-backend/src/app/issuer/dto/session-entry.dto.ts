import { Credential } from '../../credentials/entities/credential.entity';
import { CredentialOfferSessionEntity } from '../entities/credential-offer-session.entity';

export class SessionEntryDto {
  session: CredentialOfferSessionEntity;

  credentials: Credential[];
}
