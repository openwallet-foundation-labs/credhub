import { JsonWebKey } from 'node:crypto';
export class KeyResponse {
  /**
   * Id of the key
   */
  id: string;
  /**
   * Json web key
   */
  publicKey: JsonWebKey;
}
