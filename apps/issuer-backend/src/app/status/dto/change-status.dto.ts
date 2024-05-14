import { IsNumber } from 'class-validator';

export class ChangeStatusDto {
  /**
   * New status value
   */
  @IsNumber()
  status: number;
}
