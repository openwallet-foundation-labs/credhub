import { ApiProperty } from '@nestjs/swagger';
import { BitsPerStatus } from '@sd-jwt/jwt-status-list';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StatusList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: 'number',
    enum: [1, 2, 4, 8] as BitsPerStatus[],
  })
  @Column()
  bitsPerStatus: BitsPerStatus;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'blob' : 'bytea')
  list: Buffer;

  @Column()
  positions: string;

  /**
   * JWT representation of the status list
   */
  @Column()
  jwt: string;

  /**
   * Expiration time of the JWT
   */
  @Column()
  exp: number;
}
