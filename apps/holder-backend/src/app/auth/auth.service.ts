import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const USER_DELETED_EVENT = 'user.deleted';

export class UserDeletedEvent {
  id: string;
}

@Injectable()
export class AuthService {
  constructor(private eventEmitter: EventEmitter2) {}

  deleteAccount(userId: string) {
    const event = new UserDeletedEvent();
    event.id = userId;
    this.eventEmitter.emit(USER_DELETED_EVENT, event);
  }
}
