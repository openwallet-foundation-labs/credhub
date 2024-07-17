import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class StateEntity {
  @PrimaryColumn()
  hash: number;

  @Column()
  id: string;
}
