import {
  AuthenticationExtensionsClientOutputs,
  AuthenticatorAssertionResponseJSON,
  AuthenticatorAttachment,
  AuthenticationResponseJSON as IAuthenticationResponseJSON,
} from '@simplewebauthn/types';
import {
  IsOptional,
  IsString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AuthenticationResponseJSON implements IAuthenticationResponseJSON {
  id: string;
  rawId: string;
  response: AuthenticatorAssertionResponseJSON;
  @ApiProperty({ enum: ['cross-platform', 'platform'] })
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: 'public-key';
}
export class AuthSubmission {
  @IsString()
  session: string;

  @ValidateNested()
  @Type(() => AuthenticationResponseJSON)
  response: AuthenticationResponseJSON;
}

export class SubmissionRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthSubmission)
  auth?: AuthSubmission;

  @IsObject()
  values: Record<string, string>;
}
