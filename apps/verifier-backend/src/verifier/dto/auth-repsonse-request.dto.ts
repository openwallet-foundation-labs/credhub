import { PresentationSubmission } from '@sphereon/pex-models';
import { IsNumber, IsString } from 'class-validator';

export class AuthResponseRequestDto {
  //@IsNumber() will throw an error
  expires_in: number;
  @IsString()
  state: string;
  @IsString()
  presentation_submission: string | PresentationSubmission;
  @IsString()
  vp_token: string;
  @IsString()
  id_token: string;
}
