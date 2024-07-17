import {
  AuthorizationResponse,
  AuthorizationResponseState,
  AuthorizationResponseStateStatus,
} from '@sphereon/did-auth-siop';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseState } from './base-state.entity';

@Entity()
export class AuthResponseStateEntity
  extends BaseState
  implements AuthorizationResponseState
{
  @PrimaryColumn()
  id: string;
  @Column({ type: 'json' })
  response: AuthorizationResponse;
  @Column({ enum: AuthorizationResponseStateStatus })
  status: AuthorizationResponseStateStatus;
  @Column({ type: 'bigint' })
  timestamp: number;
  @Column({ type: 'bigint' })
  lastUpdated: number;
  @Column({ type: 'json', nullable: true })
  error?: Error;
}
