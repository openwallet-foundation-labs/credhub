import { IsString } from 'class-validator';

export class Oid4vciParseRequest {
  @IsString()
  url: string;
}
