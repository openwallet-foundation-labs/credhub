import { UserDeletedEvent } from '../auth.service';
import { EndpointResponse } from '../dto/endpoint-response.dto';

export abstract class OIDCClient {
  abstract endpoints(): EndpointResponse;
  abstract userDeleteEvent(payload: UserDeletedEvent): void;
}
