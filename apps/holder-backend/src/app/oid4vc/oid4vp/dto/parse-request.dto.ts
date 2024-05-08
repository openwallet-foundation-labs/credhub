import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class Oid4vpParseRequest {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  noSession?: boolean;
}
