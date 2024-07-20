import {
  AuthorizationResponsePayload,
  AuthorizationResponseStateStatus,
} from '@sphereon/did-auth-siop';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AuthResponseStateEntity {
  @PrimaryColumn()
  correlationId: string;
  @Column({ type: 'json' })
  payload: AuthorizationResponsePayload;
  @Column({ enum: AuthorizationResponseStateStatus })
  status: AuthorizationResponseStateStatus;
  @Column({ type: 'bigint' })
  timestamp: number;
  @Column({ type: 'bigint' })
  lastUpdated: number;
  @Column({ type: 'json', nullable: true })
  error?: Error;
}
