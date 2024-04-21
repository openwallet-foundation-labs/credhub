import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

type HistoryStatus = 'pending' | 'accepted' | 'declined';

@Entity()
export class History {
  /**
   * Unique ID of the history entry
   */
  @PrimaryColumn({ primary: true })
  id: string;

  /**
   * The user that owns the key
   */
  @Column({ primary: true })
  user: string;

  /**
   * Values
   */
  @Column()
  value: string;

  /**
   * Relying party
   */
  @Column()
  relyingParty: string;

  /**
   *
   */
  @Column()
  relyingPartyLogo: string;

  /**
   * Status of the history entry
   */
  @ApiProperty({ type: 'string', enum: ['pending', 'accepted', 'declined'] })
  @Column()
  status: HistoryStatus;

  /**
   * Date of creation
   */
  @CreateDateColumn()
  created_at: Date;
}
