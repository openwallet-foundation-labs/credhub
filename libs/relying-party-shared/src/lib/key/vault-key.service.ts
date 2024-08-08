import { Injectable } from '@nestjs/common';
import { KeyService } from './key.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { importSPKI, exportJWK, JWTHeaderParameters } from 'jose';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, Signer } from '@sd-jwt/types';
import { CryptoService, CryptoType } from '@credhub/backend';

@Injectable()
export class VaultKeyService extends KeyService {
  public signer!: Signer;
  private keyId: string;

  // url to the vault instance
  private vaultUrl: string;
  // headers for the vault api
  private headers: { headers: { 'X-Vault-Token': string } };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private cryptoService: CryptoService
  ) {
    super();
    this.vaultUrl = this.configService.get<string>('VAULT_URL') as string;
    this.headers = {
      headers: {
        'X-Vault-Token': this.configService.get<string>(
          'VAULT_TOKEN'
        ) as string,
      },
    };
    this.keyId = this.configService.get<string>('VAULT_KEY_ID') as string;
  }

  /**
   * Check if the vault has a key with the given id
   */
  async init() {
    await this.getPublicKey().catch(() => {
      //TODO: we need to persist this key id
      this.create();
    });
    this.signer = async (input: string) => this.sign(input);
  }

  /**
   * Creates a new keypair in the vault.
   * @param createKeyDto
   * @param user
   * @returns
   */
  async create() {
    const types: Map<CryptoType, string> = new Map();
    types.set('ES256', 'ecdsa-p256');
    types.set('Ed25519', 'ed25519');

    const res = await firstValueFrom(
      this.httpService.post(
        `${this.vaultUrl}/keys/${this.keyId}`,
        {
          exportable: false,
          type: types.get(this.cryptoService.getAlg()),
        },
        this.headers
      )
    );
    const jwk = await this.getPublicKey();
    return {
      id: res.data.id,
      publicKey: jwk,
    };
  }

  getKid(): Promise<string> {
    return Promise.resolve(this.keyId);
  }

  /**
   * Gets the public key and converts it to a KeyLike object.
   * @param id
   * @returns
   */
  async getPublicKey() {
    return firstValueFrom(
      this.httpService.get(`${this.vaultUrl}/keys/${this.keyId}`, this.headers)
    )
      .then((res) =>
        importSPKI(
          res.data.data.keys['1'].public_key,
          this.cryptoService.getAlg()
        )
      )
      .then((key) => exportJWK(key))
      .then((jwk) => {
        jwk.kid = this.keyId;
        return jwk;
      });
  }

  /**
   * Signs a value with a key in the vault.
   * @param id
   * @param user
   * @param value
   * @returns
   */
  sign(value: string): Promise<string> {
    return firstValueFrom(
      this.httpService.post(
        `${this.vaultUrl}/sign/${this.keyId}`,
        {
          input: Buffer.from(value).toString('base64'),
        },
        this.headers
      )
    ).then((res) =>
      this.derToJwtSignature(res.data.data.signature.split(':')[2])
    );
  }

  /**
   * Creates a proof of possession jwt.
   * @param user
   * @param value
   */
  async signJWT(
    payload: JwtPayload,
    header: JWTHeaderParameters
  ): Promise<string> {
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
      const signature = this.sign(signingInput);
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
