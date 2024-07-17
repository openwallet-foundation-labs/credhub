import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class NonceEntity {
  @PrimaryColumn()
  hash: number;

  @Column()
  id: string;
}
