import {
  AuthorizationRequestStateStatus,
  AuthorizationResponsePayload,
  AuthorizationResponseStateStatus,
} from '@sphereon/did-auth-siop';

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AuthStateEntity {
  @PrimaryColumn()
  correlationId: string;
  @Column({ nullable: true })
  uri: string;
  @Column()
  jwt: string;
  @Column({ enum: AuthorizationRequestStateStatus })
  status: AuthorizationRequestStateStatus | AuthorizationResponseStateStatus;
  @Column()
  timestamp: number;
  @Column()
  lastUpdated: number;
  @Column({ type: 'json', nullable: true })
  error?: Error;

  // response specific fields
  @Column({ type: 'json', nullable: true })
  payload: AuthorizationResponsePayload;
}
