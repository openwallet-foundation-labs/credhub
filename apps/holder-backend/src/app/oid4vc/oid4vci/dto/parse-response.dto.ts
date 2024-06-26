import { ApiProperty } from '@nestjs/swagger';
import {
  CredentialConfigurationSupported,
  InputCharSet,
  MetadataDisplay,
  TxCode,
} from '@sphereon/oid4vci-common';

export class TxCodeInfo implements TxCode {
  @ApiProperty({ enum: ['numeric', 'text'] })
  input_mode?: InputCharSet;

  description?: string;

  length?: number;
}
export class Oid4vciParseRepsonse {
  sessionId: string;

  credentials: CredentialConfigurationSupported[];

  issuer: MetadataDisplay[];

  txCode: TxCodeInfo;
}
