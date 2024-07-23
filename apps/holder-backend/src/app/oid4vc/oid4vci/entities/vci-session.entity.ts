import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class VCISessionEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  user: string;

  @Column()
  state: string;

  @CreateDateColumn()
  createdAt: Date;
}
