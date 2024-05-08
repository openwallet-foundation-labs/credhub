import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Credential {
  @PrimaryColumn()
  id: string;

  @Column()
  value: string;
}
