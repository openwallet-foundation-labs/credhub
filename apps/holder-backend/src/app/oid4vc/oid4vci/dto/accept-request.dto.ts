import { IsOptional, IsString } from 'class-validator';

export class AcceptRequestDto {
  @IsString()
  id: string;
  @IsString()
  @IsOptional()
  txCode?: string;
}
