import { AuthorizationRequestStateStatus } from '@sphereon/did-auth-siop';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseState } from './base-state.entity';

@Entity()
export class AuthRequestStateEntity extends BaseState {
  @PrimaryColumn()
  id: string;
  @Column({ nullable: true })
  uri: string;
  @Column()
  jwt: string;
  @Column({ enum: AuthorizationRequestStateStatus })
  status: AuthorizationRequestStateStatus;
  @Column({ type: 'bigint' })
  timestamp: number;
  @Column({ type: 'bigint' })
  lastUpdated: number;
  @Column({ type: 'json', nullable: true })
  error?: Error;
}
