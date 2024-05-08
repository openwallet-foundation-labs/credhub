import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Setting {
  /**
   * The user that owns the key
   */
  @PrimaryColumn()
  user: string;

  @Column({ default: false })
  auto: boolean;
}
