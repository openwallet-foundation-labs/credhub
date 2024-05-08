import { IsOptional, IsString } from 'class-validator';

export class SignRequest {
  /**
   * The data to sign
   * @example hello world
   */
  @IsString()
  data: string;
  /**
   * The hash algorithm to use
   * @example sha256
   */
  @IsString()
  @IsOptional()
  hashAlgorithm?: string;
}
