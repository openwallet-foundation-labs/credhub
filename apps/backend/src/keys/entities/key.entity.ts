import { JsonWebKey } from 'node:crypto';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Key {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The user that owns the key
   */
  @Column()
  user: string;

  /**
   * JSON encoded key value
   */
  @Column({ type: 'json' })
  privateKey: JsonWebKey;

  @Column({ type: 'json' })
  publicKey: JsonWebKey;
}
