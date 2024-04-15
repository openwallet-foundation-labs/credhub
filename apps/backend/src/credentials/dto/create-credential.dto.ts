import { CredentialSupported, MetadataDisplay } from '@sphereon/oid4vci-common';
import { IsObject, IsString } from 'class-validator';

export class CreateCredentialDto {
  /**
   * The id of the credential
   */
  @IsString()
  id: string;

  /**
   * JSON based credential
   */
  @IsString()
  value: string;

  /**
   * Metadata of the credential
   */
  @IsObject()
  metaData: CredentialSupported;

  @IsObject()
  issuer: MetadataDisplay;
}
