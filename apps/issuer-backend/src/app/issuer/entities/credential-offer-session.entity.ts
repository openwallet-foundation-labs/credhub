import {
  AssertedUniformCredentialOffer,
  CredentialOfferSession,
  IssueStatus,
} from '@sphereon/oid4vci-common';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class CredentialOfferSessionEntity implements CredentialOfferSession {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  clientId?: string;
  @Column({ type: 'json' })
  credentialOffer: AssertedUniformCredentialOffer;
  @Column({ nullable: true, type: 'json' })
  credentialDataSupplierInput?: unknown;
  @Column({ nullable: true, type: 'json' })
  txCode?: any;
  @Column({ nullable: true })
  userPin?: string;
  @Column()
  status: IssueStatus;
  @Column({ nullable: true })
  error?: string;
  @Column({ type: 'bigint' })
  lastUpdatedAt: number;
  @Column()
  notification_id: string;
  @Column({ nullable: true })
  issuerState?: string;
  @Column({ nullable: true })
  preAuthorizedCode?: string;
  @Column({ type: 'bigint' })
  createdAt: number;
}
