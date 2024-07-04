import {
  ConstraintsV2,
  InputDescriptorV2,
  Optionality,
  PresentationDefinitionV2,
} from '@sphereon/pex-models';
import { IsString } from 'class-validator';
//TODO: add description based on the specification: https://openid.net/specs/openid-4-verifiable-presentations-1_0.html

// also add the validation rules for the fields
export class Template {
  metadata: Metadata;
  request: Request;
}

export class Metadata {
  clientId: string;
  clientName: string;
  logo_uri: string;
}

export class Request implements PresentationDefinitionV2 {
  @IsString()
  id: string;
  @IsString()
  purpose: string;
  format: Format;
  input_descriptors: InputDescriptor[];
}

export class Format {
  'vc+sd-jwt': VcSDJwt;
}

export class VcSDJwt {}

export class InputDescriptor implements InputDescriptorV2 {
  id: string;
  name: string;
  purpose: string;
  constraints: Constraints;
}

export class Constraints implements ConstraintsV2 {
  limit_disclosure: Optionality;
  fields: Field[];
}

export class Field {
  path: string[];
  filter: Filter;
}

export class Filter {
  type: string;
  const?: string;
}
