import { RP } from '@sphereon/did-auth-siop';
import { TemplateDto } from '../templates/dto/template.dto';

/**
 * The RP instance.
 */
export interface RPInstance {
  rp: RP;
  verifier: TemplateDto;
}
