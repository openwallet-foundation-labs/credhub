import { SdJwtKbJwtInput } from '@sphereon/pex/dist/main/lib';
import { CreateKey } from './dto/create-key.dto';
import { KeyResponse } from './dto/key-response.dto';
import { ProofRequest } from './dto/proof-request.dto';
import { SignRequest } from './dto/sign-request.dto';

export abstract class KeysService {
  abstract create(createKeyDto: CreateKey, user: string): Promise<KeyResponse>;

  abstract firstOrCreate(user: string): Promise<KeyResponse>;

  abstract sign(id: string, user: string, value: SignRequest): Promise<string>;

  abstract proof(user: string, value: ProofRequest): Promise<string>;

  abstract signkbJwt(
    user: string,
    kid: string,
    kbJwt: SdJwtKbJwtInput,
    aud: string
  ): Promise<string>;

  /**
   * Decodes a base64url to a string.
   * @param data
   * @returns
   */
  protected decodeBase64Url(data: string) {
    return Buffer.from(data, 'base64url').toString();
  }
}
