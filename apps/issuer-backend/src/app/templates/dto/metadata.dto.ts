import {
  ImageInfo as IImageInfo,
  MetadataDisplay as IMetadataDisplay,
} from '@sphereon/oid4vci-common';
import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';

export class ImageInfo implements IImageInfo {
  [key: string]: unknown;
  @IsString()
  @IsOptional()
  url?: string;
  @IsString()
  @IsOptional()
  alt_text?: string;
}

class MetadataDisplay implements IMetadataDisplay {
  [key: string]: unknown;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  locale?: string;
  @ValidateNested()
  @Type(() => ImageInfo)
  logo?: ImageInfo;
  @IsString()
  @IsOptional()
  description?: string;
  @IsOptional()
  @IsString()
  background_color?: string;
  @IsOptional()
  @IsString()
  text_color?: string;
}

export class Metadata {
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => MetadataDisplay)
  display?: MetadataDisplay[];
}
