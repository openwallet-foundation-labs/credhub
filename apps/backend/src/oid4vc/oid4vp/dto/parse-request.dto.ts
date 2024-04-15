import { IsString } from 'class-validator';

export class Oid4vpParseRequest {
  @IsString()
  url: string;
}
