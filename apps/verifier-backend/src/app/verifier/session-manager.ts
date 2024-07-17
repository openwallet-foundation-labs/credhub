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
import { AuthRequestStateEntity } from './entity/auth-request-state.entity';
import { AuthResponseStateEntity } from './entity/auth-response-state.entity';
import { NonceEntity } from './entity/nonce.entity';
import { StateEntity } from './entity/state.entity';
import { BaseState } from './entity/base-state.entity';
export class DBRPSessionManager implements IRPSessionManager {
  private readonly maxAgeInSeconds: number;

  private static getKeysForCorrelationId(
    repo: Repository<NonceEntity | StateEntity>,
    correlationId: string
  ): Promise<number[]> {
    return repo
      .findBy({ id: correlationId })
      .then((entries) => entries.map((entry) => entry.hash));
  }

  public constructor(
    private requestRepository: Repository<AuthRequestStateEntity>,
    private responseRepository: Repository<AuthResponseStateEntity>,
    private nonceRepository: Repository<NonceEntity>,
    private stateRepository: Repository<StateEntity>,
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
    /* eventEmitter.on(
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
    ); */
  }

  /**
   * Checks if there are entries in the session manager. If not the RP can be reinitialized in a safe way.
   */
  isIdle(): Promise<boolean> {
    return this.cleanup().then(
      async () =>
        (await this.requestRepository.count()) === 0 &&
        (await this.responseRepository.count()) === 0
    );
  }

  getAllRequestStates(): Promise<AuthorizationRequestState[]> {
    return this.requestRepository.find() as unknown as Promise<
      AuthorizationRequestState[]
    >;
  }

  async getRequestStateByCorrelationId(
    id: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    const findRequest = errorOnNotFound
      ? this.requestRepository.findOneByOrFail({ id })
      : this.requestRepository.findOneBy({ id });

    const res = await findRequest;
    if (!res) return;

    return {
      lastUpdated: res.lastUpdated,
      timestamp: res.timestamp,
      correlationId: res.correlationId,
      error: res.error ? new Error(res.error.message) : undefined,
      status: res.status,
      request: await AuthorizationRequest.fromUriOrJwt(res.jwt),
    };
  }

  async getRequestStateByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    return await this.getFromMapping(
      'nonce',
      nonce,
      this.requestRepository,
      errorOnNotFound
    );
  }

  async getRequestStateByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationRequestState | undefined> {
    return await this.getFromMapping(
      'state',
      state,
      this.requestRepository,
      errorOnNotFound
    );
  }

  async getResponseStateByCorrelationId(
    correlationId: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    if (errorOnNotFound) {
      return this.responseRepository.findOneByOrFail({ correlationId });
    }
    return this.responseRepository.findOneBy({ correlationId });
  }

  async getResponseStateByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    return await this.getFromMapping(
      'nonce',
      nonce,
      this.responseRepository,
      errorOnNotFound
    );
  }

  async getResponseStateByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<AuthorizationResponseState | undefined> {
    return await this.getFromMapping(
      'state',
      state,
      this.responseRepository,
      errorOnNotFound
    );
  }

  private async getFromMapping<T extends BaseState>(
    type: 'nonce' | 'state' | 'correlationId',
    value: string,
    repo: Repository<BaseState>,
    errorOnNotFound?: boolean
  ): Promise<T> {
    console.log('get by', type);
    const correlationId = await this.getCorrelationIdImpl(
      type,
      value,
      errorOnNotFound
    );
    const result = await repo.findOneBy({ correlationId });
    if (!result && errorOnNotFound) {
      throw Error(
        `Could not find ${type} from correlation id ${correlationId}`
      );
    }
    return result as T;
  }

  private async onAuthorizationRequestCreatedSuccess(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    this.requestRepository.save(
      this.requestRepository.create({
        id: event.correlationId,
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
    //.catch((error) => console.log(JSON.stringify(error)));
  }

  /* private async onAuthorizationRequestCreatedFailed(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    this.updateState(
      'request',
      event,
      AuthorizationRequestStateStatus.ERROR
    ).catch((error) => console.log(JSON.stringify(error)));
  }

  private async onAuthorizationRequestSentSuccess(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    this.updateState(
      'request',
      event,
      AuthorizationRequestStateStatus.SENT
    ).catch((error) => console.log(JSON.stringify(error)));
  }

  private async onAuthorizationRequestSentFailed(
    event: AuthorizationEvent<AuthorizationRequest>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    this.updateState(
      'request',
      event,
      AuthorizationRequestStateStatus.ERROR
    ).catch((error) => console.log(JSON.stringify(error)));
  }

  private async onAuthorizationResponseReceivedSuccess(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    await this.updateState(
      'response',
      event,
      AuthorizationResponseStateStatus.RECEIVED
    );
  }

  private async onAuthorizationResponseReceivedFailed(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    this.cleanup().catch((error) => console.log(JSON.stringify(error)));
    await this.updateState(
      'response',
      event,
      AuthorizationResponseStateStatus.ERROR
    );
  }

  private async onAuthorizationResponseVerifiedFailed(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    await this.updateState(
      'response',
      event,
      AuthorizationResponseStateStatus.ERROR
    );
  }

  private async onAuthorizationResponseVerifiedSuccess(
    event: AuthorizationEvent<AuthorizationResponse>
  ): Promise<void> {
    await this.updateState(
      'response',
      event,
      AuthorizationResponseStateStatus.VERIFIED
    );
  } */

  public async getCorrelationIdByNonce(
    nonce: string,
    errorOnNotFound?: boolean
  ): Promise<string | undefined> {
    return await this.getCorrelationIdImpl('nonce', nonce, errorOnNotFound);
  }

  public async getCorrelationIdByState(
    state: string,
    errorOnNotFound?: boolean
  ): Promise<string | undefined> {
    return await this.getCorrelationIdImpl('state', state, errorOnNotFound);
  }

  private async getCorrelationIdImpl(
    type: 'nonce' | 'state' | 'correlationId',
    value: string,
    errorOnNotFound?: boolean
  ): Promise<string | undefined> {
    console.log('get me by', type);
    if (!value || !type) {
      throw Error('No type or value provided');
    }
    if (type === 'correlationId') {
      return value;
    }
    const hash = await hashCode(value);
    const entry = await (type === 'nonce'
      ? this.nonceRepository.findOneBy({ hash })
      : this.stateRepository.findOneBy({ hash }));
    if (!entry && errorOnNotFound) {
      throw Error(`Could not find ${type} value for ${value}`);
    }
    return entry.id;
  }

  private async updateMapping(
    repo: Repository<StateEntity | NonceEntity>,
    event: AuthorizationEvent<AuthorizationRequest | AuthorizationResponse>,
    key: string,
    value: string | undefined,
    allowExisting: boolean
  ) {
    const hash = await hashcodeForValue(event, key);
    const existing = await repo.findOneBy({ hash });
    if (existing) {
      if (!allowExisting) {
        throw Error(
          `Mapping exists for key ${key} and we do not allow overwriting values`
        );
      } else if (value && existing.id !== value) {
        throw Error('Value changed for key');
      }
    }
    if (!value) {
      await repo.delete({ hash });
    } else {
      repo.save({ hash, id: value });
    }
  }

  /*   private async updateState(
    type: 'request' | 'response',
    event: AuthorizationEvent<AuthorizationRequest | AuthorizationResponse>,
    status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus
  ): Promise<void> {
    if (!event) {
      throw new Error('event not present');
    } else if (!event.correlationId) {
      throw new Error(
        `'${type} ${status}' event without correlation id received`
      );
    }
    try {
      const eventState = {
        correlationId: event.correlationId,
        jwt: await (
          event as AuthorizationEvent<AuthorizationRequest>
        ).subject.requestObjectJwt(),
        uri: (event as AuthorizationEvent<AuthorizationRequest>).subject.payload
          .redirect_uri,
        ...(event.error ? { error: event.error } : {}),
        status,
        timestamp: event.timestamp,
        lastUpdated: event.timestamp,
      };
      console.log(event.subject);
      console.log(eventState);
      if (type === 'request') {
        await this.requestRepository.save(
          this.requestRepository.create({
            id: event.correlationId,
          })
        );
        // We do not await these
        this.updateMapping(
          this.nonceRepository,
          event,
          'nonce',
          event.correlationId,
          true
        ).catch((error) => console.log(JSON.stringify(error)));
        this.updateMapping(
          this.stateRepository,
          event,
          'state',
          event.correlationId,
          true
        ).catch((error) => console.log(JSON.stringify(error)));
      } else {
        await this.responseRepository.save(
          this.responseRepository.create({
            id: event.correlationId,
            ...(eventState as AuthorizationResponseState),
          })
        );
      }
    } catch (error: unknown) {
      console.log(`Error in update state happened: ${error}`);
      // TODO VDX-166 handle error
    }
  } */

  async deleteStateForCorrelationId(correlationId: string) {
    DBRPSessionManager.cleanMappingForCorrelationId(
      this.nonceRepository,
      correlationId
    ).catch((error) => console.log(JSON.stringify(error)));
    DBRPSessionManager.cleanMappingForCorrelationId(
      this.stateRepository,
      correlationId
    ).catch((error) => console.log(JSON.stringify(error)));
    await this.requestRepository.delete({ correlationId });
    await this.responseRepository.delete({ correlationId });
  }
  private static async cleanMappingForCorrelationId(
    repo: Repository<NonceEntity | StateEntity>,
    correlationId: string
  ): Promise<void> {
    const keys = await DBRPSessionManager.getKeysForCorrelationId(
      repo,
      correlationId
    );
    if (keys && keys.length > 0) {
      //TODO: maybe pass all keys to the delete function
      await Promise.all(keys.map((key) => repo.delete({ hash: key })));
    }
  }

  private async cleanup() {
    const now = Date.now();
    const maxAgeInMS = this.maxAgeInSeconds * 1000;

    const cleanupCorrelations = (
      reqByCorrelationId: [
        string,
        AuthRequestStateEntity | AuthResponseStateEntity
      ]
    ) => {
      const correlationId = reqByCorrelationId[0];
      const authRequest = reqByCorrelationId[1];
      if (authRequest) {
        const ts = authRequest.lastUpdated || authRequest.timestamp;
        if (maxAgeInMS !== 0 && now > ts + maxAgeInMS) {
          this.deleteStateForCorrelationId(correlationId);
        }
      }
    };
    const requestCleanup = this.requestRepository.find().then((requests) =>
      requests.forEach((req) => {
        cleanupCorrelations([req.correlationId, req]);
      })
    );
    const responseCleanup = this.responseRepository.find().then((responses) =>
      responses.forEach((res) => {
        cleanupCorrelations([res.correlationId, res]);
      })
    );
    await Promise.all([requestCleanup, responseCleanup]);
  }
}

async function hashcodeForValue(
  event: AuthorizationEvent<AuthorizationRequest | AuthorizationResponse>,
  key: string
): Promise<number> {
  const value = (await event.subject.getMergedProperty(key)) as string;
  if (!value) {
    throw Error(`No value found for key ${key} in Authorization Request`);
  }
  return hashCode(value);
}

function hashCode(s: string): number {
  let h = 1;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

  return h;
}
