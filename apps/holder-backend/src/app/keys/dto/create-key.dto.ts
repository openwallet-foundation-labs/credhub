import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const KeyType = ['ES256', 'ES384', 'ES512'];

export class CreateKey {
  /**
   * Type of the key
   * @example ES256
   */
  @IsEnum(KeyType)
  @ApiProperty({ enum: KeyType, example: 'ES256', enumName: 'KeyType' })
  type: string;
}
