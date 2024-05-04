import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
export class SessionRequestDto {
  /**
   * The subject of the credential that should be issued.
   */
  @IsObject()
  @IsOptional()
  credentialSubject: Record<string, unknown>;
  /**
   * The id of the credential that should be issued.
   * @example Identity
   */
  @IsString()
  credentialId: string;
  /**
   * If the user pin is required.
   * @example false
   */
  @IsBoolean()
  @IsOptional()
  pin: boolean;
}
