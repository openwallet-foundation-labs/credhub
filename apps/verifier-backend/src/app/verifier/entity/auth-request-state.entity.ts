import { AuthorizationRequestStateStatus } from '@sphereon/did-auth-siop';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AuthRequestStateEntity {
  @PrimaryColumn()
  correlationId: string;
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
