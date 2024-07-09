import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { oidcclientName } from './oidc-client/oidcclient.module';
import { OIDCClient } from './oidc-client/oidc-client';

export const USER_DELETED_EVENT = 'user.deleted';

export class UserDeletedEvent {
  id: string;
}
@Injectable()
export class AuthService {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject(oidcclientName) private oidcClient: OIDCClient
  ) {}

  endpoints() {
    return this.oidcClient.endpoints();
  }

  async deleteAccount(userId: string) {
    const event = new UserDeletedEvent();
    event.id = userId;
    this.eventEmitter.emit(USER_DELETED_EVENT, event);
    return this.oidcClient.userDeleteEvent(event);
  }
}
