import { CredentialSupported, MetadataDisplay } from '@sphereon/oid4vci-common';
import { IsArray, IsString } from 'class-validator';

export class Oid4vciParseRepsonse {
  @IsString()
  sessionId: string;

  @IsArray()
  credentials: CredentialSupported[];

  @IsArray()
  issuer: MetadataDisplay[];
}
