import { ApiProperty } from '@nestjs/swagger';
import { BitsPerStatus } from '@sd-jwt/jwt-status-list';
import { IsIn, IsNumber, Min } from 'class-validator';

export class CreateListDto {
  /**
   * Number of bits per status
   * @example 1
   */
  @IsNumber()
  @IsIn([1, 2, 4, 8])
  bitsPerStatus: BitsPerStatus;

  /**
   * Size of the list
   * @example 1000
   */
  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(1)
  size: number;
}
