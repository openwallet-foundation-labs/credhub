import { UserDeletedEvent } from '../auth.service';

export abstract class OIDCClient {
  abstract userDeleteEvent(payload: UserDeletedEvent): void;
}
