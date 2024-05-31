import { ApiHideProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Setting {
  /**
   * The user that owns the key
   */
  @ApiHideProperty()
  @PrimaryColumn()
  user: string;

  @Column({ default: false })
  auto: boolean;

  @Column({ default: false })
  darkTheme: boolean;
}
