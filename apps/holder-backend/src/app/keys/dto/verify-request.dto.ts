import { SignRequest } from './sign-request.dto';

export class VerifyRequest extends SignRequest {
  /**
   * The signature to verify
   */
  signature: string;
}
