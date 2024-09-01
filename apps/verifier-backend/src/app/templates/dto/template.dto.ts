import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ConstraintsV2,
  InputDescriptorV2,
  Optionality,
  PresentationDefinitionV2,
} from '@sphereon/pex-models';

export class Metadata {
  @IsString()
  clientId: string;

  @IsString()
  clientName: string;

  @IsString()
  @IsOptional()
  logo_uri: string;
}

export class VcSDJwt {}

export class Format {
  @ValidateNested()
  @Type(() => VcSDJwt)
  'vc+sd-jwt': VcSDJwt;
}

export class Request implements PresentationDefinitionV2 {
  @IsString()
  id: string;

  @IsString()
  purpose: string;

  @ValidateNested()
  @Type(() => Format)
  format: Format;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InputDescriptor)
  input_descriptors: InputDescriptor[];
}
export class TemplateDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => Metadata)
  metadata: Metadata;

  @ValidateNested()
  @Type(() => Request)
  request: Request;
}

export class Filter {
  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  const?: string;
}

export class Field {
  @IsArray()
  @IsString({ each: true })
  path: string[];

  @ValidateNested()
  @Type(() => Filter)
  filter: Filter;
}
export class Constraints implements ConstraintsV2 {
  @IsEnum(Optionality)
  limit_disclosure: Optionality;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Field)
  fields: Field[];
}

export class InputDescriptor implements InputDescriptorV2 {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  purpose: string;

  @ValidateNested()
  @Type(() => Constraints)
  constraints: Constraints;
}
