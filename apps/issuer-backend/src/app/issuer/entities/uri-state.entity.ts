import { URIState } from '@sphereon/oid4vci-common';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class URIStateEntity implements URIState {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  issuerState?: string;

  @Column({ nullable: true })
  preAuthorizedCode?: string;

  @Column()
  uri: string;

  @Column({ type: 'bigint' })
  createdAt: number;
}
