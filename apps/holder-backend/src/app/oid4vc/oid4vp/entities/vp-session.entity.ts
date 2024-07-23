import { PresentationDefinitionWithLocation } from '@sphereon/did-auth-siop';
import { PrimaryColumn, Column, CreateDateColumn, Entity } from 'typeorm';

@Entity()
export class VPSessionEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  user: string;

  @Column()
  requestObjectJwt: string;

  @Column({ type: 'json' })
  pds: PresentationDefinitionWithLocation[];

  @CreateDateColumn()
  createdAt: Date;
}
