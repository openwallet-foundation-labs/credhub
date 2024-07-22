import {
  IRPSessionManager,
  AuthorizationRequestState,
  AuthorizationResponseState,
  AuthorizationEvents,
  AuthorizationEvent,
  AuthorizationRequest,
  AuthorizationRequestStateStatus,
  AuthorizationResponse,
  AuthorizationResponseStateStatus,
} from '@sphereon/did-auth-siop';
import { EventEmitter } from 'node:events';
import { Repository } from 'typeorm';
import { AuthStateEntity } from './entity/auth-state.entity';

export class DBRPSessionManager implements IRPSessionManager {
  private readonly maxAgeInSeconds: number;

  public constructor(
    private authStateRepository: Repository<AuthStateEntity>,
    eventEmitter: EventEmitter,
    opts?: { maxAgeInSeconds?: number }
  ) {
    if (!eventEmitter) {
      throw Error(
        'RP Session manager depends on an event emitter in the application'
      );
    }
    this.maxAgeInSeconds = opts?.maxAgeInSeconds ?? 5 * 60;
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_REQUEST_CREATED_SUCCESS,
      this.onAuthorizationRequestCreatedSuccess.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_REQUEST_CREATED_FAILED,
      this.onAuthorizationRequestCreatedFailed.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_REQUEST_SENT_SUCCESS,
      this.onAuthorizationRequestSentSuccess.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_REQUEST_SENT_FAILED,
      this.onAuthorizationRequestSentFailed.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_RESPONSE_RECEIVED_SUCCESS,
      this.onAuthorizationResponseReceivedSuccess.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_RESPONSE_RECEIVED_FAILED,
      this.onAuthorizationResponseReceivedFailed.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_RESPONSE_VERIFIED_SUCCESS,
      this.onAuthorizationResponseVerifiedSuccess.bind(this)
    );
    eventEmitter.on(
      AuthorizationEvents.ON_AUTH_RESPONSE_VERIFIED_FAILED,
      this.onAuthorizationResponseVerifiedFailed.bind(this)
    );
  }

  /**
   * Checks if there are entries in the session manager. If not the RP can be reinitialized in a safe way.
   */
  isIdle(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getAllStates() {
    return this.authStateRepository.find({ order: { timestamp: 'DESC' } });
  }

  async getRequestStateByCorrelationId(
    id: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    const findRequest = errorOnNotFound
      ? this.authStateRepository.findOneByOrFail({ correlationId: id })
      : this.authStateRepository.findOneBy({ correlationId: id });

    const res = await findRequest;
    if (!res) return;

    return {
      lastUpdated: res.lastUpdated,
      timestamp: res.timestamp,
      correlationId: res.correlationId,
      error: res.error ? new Error(res.error.message) : undefined,
      status: res.status as AuthorizationRequestStateStatus,
      request: await AuthorizationRequest.fromUriOrJwt(res.jwt),
    };
  }

  async getRequestStateByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    throw Error('get request by nonce not implemented');
  }

  async getRequestStateByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    throw Error('get request by state not implemented');
  }

  async getResponseStateByCorrelationId(
    correlationId: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    const findRequest = errorOnNotFound
      ? this.authStateRepository.findOneByOrFail({ correlationId })
      : this.authStateRepository.findOneBy({ correlationId });

    const res = await findRequest;
    if (!res || !res.payload) return;
    return {
      lastUpdated: res.lastUpdated,
      timestamp: res.timestamp,
      correlationId: res.correlationId,
      error: res.error ? new Error(res.error.message) : undefined,
      status: res.status as AuthorizationResponseStateStatus,
      response: await AuthorizationResponse.fromPayload(res.payload),
    };
  }

  async getResponseStateByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    throw Error('get response by nonce not implemented');
  }

  async getResponseStateByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    throw Error('get response by state not implemented');
  }

  private async onAuthorizationRequestCreatedSuccess(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    this.authStateRepository.save(
      this.authStateRepository.create({
        correlationId: event.correlationId,
        jwt: await (
          event as AuthorizationEvent<AuthorizationRequest>
        ).subject.requestObjectJwt(),
        uri: (event as AuthorizationEvent<AuthorizationRequest>).subject.payload
          .redirect_uri,
        timestamp: event.timestamp,
        lastUpdated: event.timestamp,
        status: AuthorizationRequestStateStatus.CREATED,
      })
    );
  }

  private async onAuthorizationRequestCreatedFailed(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationRequestStateStatus.ERROR,
        error: event.error,
        lastUpdated: event.timestamp,
      }
    );
  }

  private async onAuthorizationRequestSentSuccess(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationRequestStateStatus.SENT,
        lastUpdated: event.timestamp,
      }
    );
  }

  private async onAuthorizationRequestSentFailed(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationRequestStateStatus.ERROR,
        error: event.error,
        lastUpdated: event.timestamp,
      }
    );
  }

  private async onAuthorizationResponseReceivedSuccess(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    console.log('save response');
    console.log(event.subject.payload);
    const element = this.authStateRepository.create({
      correlationId: event.correlationId,
      status: AuthorizationResponseStateStatus.RECEIVED,
      timestamp: event.timestamp,
      lastUpdated: event.timestamp,
      payload: event.subject.payload,
    });
    console.log(element);
    await this.authStateRepository.save(element);
  }

  private async onAuthorizationResponseReceivedFailed(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationResponseStateStatus.ERROR,
        lastUpdated: event.timestamp,
        error: event.error,
      }
    );
  }

  private async onAuthorizationResponseVerifiedFailed(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationResponseStateStatus.ERROR,
        lastUpdated: event.timestamp,
        error: event.error,
      }
    );
  }

  private async onAuthorizationResponseVerifiedSuccess(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    await this.authStateRepository.update(
      { correlationId: event.correlationId },
      {
        status: AuthorizationResponseStateStatus.VERIFIED,
        lastUpdated: event.timestamp,
      }
    );
  }

  public async getCorrelationIdByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<string | undefined> {
    throw new Error('Not implemented');
  }

  public async getCorrelationIdByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<string | undefined> {
    throw new Error('Not implemented');
  }

  async deleteStateForCorrelationId(correlationId: string) {
    await this.authStateRepository.delete({ correlationId });
    await this.authStateRepository.delete({ correlationId });
  }
}
