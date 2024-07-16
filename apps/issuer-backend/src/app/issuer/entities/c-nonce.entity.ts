import { CNonceState } from '@sphereon/oid4vci-common';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class CNonceEntity implements CNonceState {
  @PrimaryColumn()
  id: string;

  @Column()
  cNonce: string;

  @Column({ nullable: true })
  issuerState?: string;

  @Column({ nullable: true })
  preAuthorizedCode?: string;

  @Column()
  createdAt: number;
}
