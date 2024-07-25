import { Injectable } from '@nestjs/common';
import { KeysService } from './keys.service';
import { SdJwtKbJwtInput } from '@sphereon/pex/dist/main/lib';
import { CreateKey } from './dto/create-key.dto';
import { KeyResponse } from './dto/key-response.dto';
import { ProofRequest } from './dto/proof-request.dto';
import { SignRequest } from './dto/sign-request.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { importSPKI, KeyLike, exportJWK, JWK } from 'jose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VaultKeysService extends KeysService {
  // url to the vault instance
  private vaultUrl: string;
  // headers for the vault api
  private headers: { headers: { 'X-Vault-Token': string } };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    super();
    this.vaultUrl = this.configService.get<string>('VAULT_URL');
    this.headers = {
      headers: {
        'X-Vault-Token': this.configService.get<string>('VAULT_TOKEN'),
      },
    };
  }

  /**
   * Creates a new keypair in the vault.
   * @param createKeyDto
   * @param user
   * @returns
   */
  async create(createKeyDto: CreateKey, user: string): Promise<KeyResponse> {
    if (createKeyDto.type !== 'ES256') {
      throw new Error('Only ES256 is supported');
    }
    //TODO: the key id should not be the user id since a user can have multiple keys. Therefore we need a one to many mapping. Also configure that an existing key can not be overwritten.
    const res = await firstValueFrom(
      this.httpService.post(
        `${this.vaultUrl}/keys/${user}`,
        {
          exportable: false,
          type: 'ecdsa-p256',
        },
        this.headers
      )
    ).catch((error) => {
      console.error(error);
      throw error;
    });
    const jwk = await this.getPublicKeyAsJwk(user);
    return {
      id: res.data.id,
      publicKey: jwk,
    };
  }

  /**
   * Deletes a key in the vault.
   * @param id
   * @returns
   */
  private deleteKey(id: string) {
    // first set the deletion_allowed to true
    return firstValueFrom(
      this.httpService.post(
        `${this.vaultUrl}/keys/${id}/config`,
        {
          deletion_allowed: true,
        },
        this.headers
      )
    ).then(() =>
      firstValueFrom(
        this.httpService.delete(`${this.vaultUrl}/keys/${id}`, this.headers)
      )
    );
  }

  /**
   * Gets the public key and converts it to a KeyLike object.
   * @param id
   * @returns
   */
  private async getPublicKey(id: string): Promise<KeyLike> {
    return firstValueFrom(
      this.httpService.get(`${this.vaultUrl}/keys/${id}`, this.headers)
    ).then((res) => importSPKI(res.data.data.keys['1'].public_key, 'ES256'));
  }

  getPublicKeyAsJwk(id: string): Promise<JWK> {
    return this.getPublicKey(id)
      .then((key) => exportJWK(key))
      .then((jwk) => {
        jwk.kid = id;
        return jwk;
      });
  }

  /**
   * Gets the public key of a user or creates a new keypair if it does not exist.
   * @param user
   * @returns
   */
  firstOrCreate(user: string): Promise<KeyResponse> {
    return this.getPublicKeyAsJwk(user).then(
      (jwk) => ({
        id: user,
        publicKey: jwk,
      }),
      () => this.create({ type: 'ES256' }, user)
    );
  }

  /**
   * Signs a value with a key in the vault.
   * @param id
   * @param user
   * @param value
   * @returns
   */
  sign(id: string, user: string, value: SignRequest): Promise<string> {
    const keyId = user;
    return firstValueFrom(
      this.httpService.post(
        `${this.vaultUrl}/sign/${keyId}`,
        {
          algorithm: value.hashAlgorithm,
          input: Buffer.from(value.data).toString('base64'),
        },
        this.headers
      )
    )
      .then((res) =>
        this.derToJwtSignature(res.data.data.signature.split(':')[2])
      )
      .then((signature) => `${value.data}.${signature}`);
  }

  /**
   * Creates a proof of possession jwt.
   * @param user
   * @param value
   */
  async proof(user: string, value: ProofRequest): Promise<string> {
    const keyId = user;
    const jwk = await this.getPublicKeyAsJwk(keyId);

    // JWT header
    const header = {
      //alg has to be changed when we will support other algorithms
      alg: 'ES256',
      typ: 'openid4vci-proof+jwt',
      jwk,
    };

    // JWT payload
    const payload = {
      ...value.payload,
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + 7200, // Expiration time set to 2 hours
    };

    // Convert header and payload to Base64 to prepare for Vault
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url'
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url'
    );
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Request to Vault for signing
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.vaultUrl}/sign/${keyId}/sha2-256`,
          {
            input: Buffer.from(signingInput).toString('base64'),
          },
          this.headers
        )
      );

      const signature = this.derToJwtSignature(
        response.data.data.signature.split(':')[2]
      );
      const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;
      return jwt;
    } catch (error) {
      console.error('Error signing JWT with Vault:', error);
      throw error;
    }
  }

  private base64ToBase64Url(str: string) {
    return str.replace('+', '-').replace('/', '_').replace(/=+$/, '');
  }

  /**
   * Signs a kb jwt.
   * @param user
   * @param kid
   * @param kbJwt
   * @param aud
   */
  async signkbJwt(
    user: string,
    kid: string,
    kbJwt: SdJwtKbJwtInput,
    aud: string
  ): Promise<string> {
    const keyId = user;
    // const jwk = await this.getPublicKeyAsJwk(keyId);
    // JWT header
    const header = {
      //alg has to be changed when we will support other algorithms
      alg: 'ES256',
      typ: kbJwt.header.typ,
      // maybe reference the keyid. In case of did:jwk this does not make sense right now.
    };

    // JWT payload
    const payload = {
      ...kbJwt.payload,
      aud,
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + 7200, // Expiration time set to 2 hours
    };

    // Convert header and payload to Base64 to prepare for Vault
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url'
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url'
    );
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Request to Vault for signing
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.vaultUrl}/sign/${keyId}/sha2-256`,
          {
            input: Buffer.from(signingInput).toString('base64'),
          },
          this.headers
        )
      );

      // Extract the signature from response and construct the full JWT
      const signature = this.base64ToBase64Url(
        response.data.data.signature.split(':')[2]
      );
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
      console.error('Error signing JWT with Vault:', error);
      throw error;
    }
  }

  /**
   * Converts a DER signature to a JWT signature.
   * @param derSignature
   * @returns
   */
  derToJwtSignature(derSignature: string) {
    // Step 1: Extract r and s from DER signature
    const der = Buffer.from(derSignature, 'base64');
    const sequence = der.slice(2); // Skip the sequence tag and length
    const rLength = sequence[1];
    const r = sequence.slice(2, 2 + rLength);
    const s = sequence.slice(2 + rLength + 2); // Skip r, its tag and length byte, and s's tag and length byte

    // Step 2: Ensure r and s are 32 bytes each (pad with zeros if necessary)
    // Ensure r and s are 32 bytes each
    let rPadded: Buffer;
    let sPadded: Buffer;
    if (r.length > 32) {
      if (r.length === 33 && r[0] === 0x00) {
        rPadded = r.slice(1);
      } else {
        throw new Error('Invalid r length in DER signature');
      }
    } else {
      rPadded = Buffer.concat([Buffer.alloc(32 - r.length), r]);
    }
    if (s.length > 32) {
      if (s.length === 33 && s[0] === 0x00) {
        sPadded = s.slice(1);
      } else {
        throw new Error('Invalid s length in DER signature');
      }
    } else {
      sPadded = Buffer.concat([Buffer.alloc(32 - s.length), s]);
    }

    // Step 3: Concatenate r and s to form the raw signature
    const rawSignature = Buffer.concat([rPadded, sPadded]);

    // Step 4: Base64url encode the raw signature
    return rawSignature
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
