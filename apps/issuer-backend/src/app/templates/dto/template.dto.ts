import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CredentialConfigurationSupportedV1_0_13 as ICredentialConfigurationSupportedV1_0_13,
  CredentialDefinitionV1_0_13 as ICredentialDefinitionV1_0_13,
  CredentialsSupportedDisplay as ICredentialSupportDisplay,
  ImageInfo as IImageInfo,
  IssuerCredentialSubject,
  KeyProofType,
  OID4VCICredentialFormat,
  ProofType,
} from '@sphereon/oid4vci-common';
import { DisclosureFrame } from '@sd-jwt/types';

export class ImageInfo implements IImageInfo {
  [key: string]: unknown;
  @IsString()
  url: string;
  @IsString()
  alt_text: string;
}
class CredentialsSupportedDisplay implements ICredentialSupportDisplay {
  [key: string]: unknown;
  description?: string;
  @IsString()
  name: string;
  @IsString()
  locale: string;
  @ValidateNested()
  @Type(() => ImageInfo)
  logo: ImageInfo;
  @ValidateNested()
  @Type(() => ImageInfo)
  @IsOptional()
  background_image?: ImageInfo;
  @IsString()
  @IsOptional()
  background_color?: string;
  @IsString()
  @IsOptional()
  text_color?: string;
}

class CredentialDefinitionV1_0_13 implements ICredentialDefinitionV1_0_13 {
  @IsString()
  @IsOptional()
  @IsArray()
  type?: string[];

  @IsOptional()
  credentialSubject?: IssuerCredentialSubject;
}

export class CredentialConfigurationSupportedV1_0_13
  implements ICredentialConfigurationSupportedV1_0_13
{
  [x: string]: unknown;

  @ValidateNested()
  @Type(() => CredentialDefinitionV1_0_13)
  credential_definition: CredentialDefinitionV1_0_13;

  @IsOptional()
  vct: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsObject()
  claims?: IssuerCredentialSubject;

  @IsNotEmpty()
  format: OID4VCICredentialFormat;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsArray()
  cryptographic_binding_methods_supported?: string[];

  @IsOptional()
  @IsArray()
  credential_signing_alg_values_supported?: string[];

  @IsOptional()
  @IsObject()
  proof_types_supported?: Record<KeyProofType, ProofType>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialsSupportedDisplay)
  display?: CredentialsSupportedDisplay[];
}

export class Template {
  @ValidateNested()
  @Type(() => CredentialConfigurationSupportedV1_0_13)
  schema: CredentialConfigurationSupportedV1_0_13;

  @IsObject()
  sd: DisclosureFrame<Record<string, unknown | boolean>>;

  @IsInt()
  ttl: number;
}
