import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class Oid4vciParseRequest {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  noSession?: boolean;
}
