import {
  type ECKeyPairOptions,
  type JsonWebKey,
  type KeyLike,
  createVerify,
  generateKeyPairSync,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SdJwtKbJwtInput } from '@sphereon/pex/dist/main/lib';
import {
  type JWTHeaderParameters,
  type JWTPayload,
  type KeyLike as JoseKeyLike,
  SignJWT,
  importJWK,
} from 'jose';
import { Repository } from 'typeorm';
import { CreateKey } from './dto/create-key.dto';
import { KeyResponse } from './dto/key-response.dto';
import { ProofRequest } from './dto/proof-request.dto';
import { SignRequest } from './dto/sign-request.dto';
import { VerifyRequest } from './dto/verify-request.dto';
import { VerifyResponse } from './dto/verify-response.dto';
import { Key } from './entities/key.entity';

@Injectable()
export class KeysService {
  constructor(@InjectRepository(Key) private keyRepository: Repository<Key>) {}

  async create(createKeyDto: CreateKey, user: string): Promise<KeyResponse> {
    const curves = {
      ES256: 'P-256',
      ES384: 'P-384',
      ES512: 'P-521',
    };
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: curves[createKeyDto.type],
      publicKeyEncoding: {
        type: 'spki',
        format: 'jwk',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'jwk',
      },
    } as ECKeyPairOptions<'jwk', 'jwk'>);

    const key = new Key();
    key.user = user;
    key.privateKey = privateKey as unknown as JsonWebKey;
    key.publicKey = publicKey as unknown as JsonWebKey;
    const entity = await this.keyRepository.save(key);
    return {
      id: entity.id,
      publicKey: publicKey as unknown as JsonWebKey,
    };
  }

  findAll(user: string) {
    return this.keyRepository.find({ where: { user } }).then((keys) => {
      return keys.map((key) => {
        return {
          id: key.id,
          publicKey: key.publicKey,
        };
      });
    });
  }

  firstOrCreate(user: string) {
    return this.keyRepository.findOne({ where: { user } }).then((key) => {
      if (!key) {
        return this.create({ type: 'ES256' }, user);
      }
      return key;
    });
  }

  findOne(id: string, user: string) {
    return this.keyRepository
      .findOneOrFail({ where: { id, user } })
      .then((key) => ({
        id: key.id,
        publicKey: key.publicKey,
      }));
  }

  remove(id: string, user: string) {
    return this.keyRepository.delete({ id, user });
  }

  sign(id: string, user: string, value: SignRequest) {
    return this.keyRepository
      .findOneOrFail({ where: { id, user } })
      .then(async (key) => {
        const jwk = await importJWK(key.privateKey, 'ES256');
        const header = JSON.parse(
          this.decodeBase64Url(value.data.split('.')[0])
        ) as JWTHeaderParameters;
        const payload = JSON.parse(
          this.decodeBase64Url(value.data.split('.')[1])
        ) as JWTPayload;
        const jwt = await new SignJWT(payload)
          .setProtectedHeader(header)
          .sign(jwk);
        return jwt.split('.')[2];
      });
  }

  decodeBase64Url(data: string) {
    return Buffer.from(data, 'base64url').toString();
  }

  async proof(user: string, value: ProofRequest) {
    let key: Key;
    if (value.kid) {
      key = await this.keyRepository.findOneOrFail({
        where: { id: value.kid, user },
      });
    } else {
      const newKey = await this.create({ type: 'ES256' }, user);
      key = await this.keyRepository.findOneOrFail({
        where: { id: newKey.id },
      });
    }
    //TODO: add the key id when the key is interset into the database. For this the primary get has to be generated first
    key.publicKey.kid = key.id;

    const jwk = await importJWK<JoseKeyLike>(key.privateKey, 'ES256');
    return {
      jwt: await new SignJWT({ ...value.payload })
        .setProtectedHeader({
          alg: 'ES256',
          typ: 'openid4vci-proof+jwt',
          jwk: key.publicKey,
        })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(jwk),
    };
  }

  public async signkbJwt(
    user: string,
    kid: string,
    kbJwt: SdJwtKbJwtInput,
    aud: string
  ) {
    const key = await this.keyRepository.findOneOrFail({
      where: { id: kid, user },
    });
    const jwk = await importJWK<JoseKeyLike>(key.privateKey, 'ES256');
    const jwt = await new SignJWT({ ...kbJwt.payload, aud })
      .setProtectedHeader({ typ: kbJwt.header.typ, alg: 'ES256', kid })
      .sign(jwk);
    return jwt;
  }

  /**
   * Encodes a public key as a DID JWK.
   * @param key
   */
  encodeDidJWK(key: JsonWebKey) {
    return `did:jwk:${Buffer.from(JSON.stringify(key)).toString(
      'base64url'
    )}#0`;
  }

  /**
   * Decodes a DID JWK to a public key.
   * @param did
   * @returns
   */
  decodeDidJWK(did: string) {
    return JSON.parse(
      Buffer.from(did.split('#')[0].split(':')[2], 'base64url').toString()
    ) as JsonWebKey;
  }

  verify(
    id: string,
    user: string,
    value: VerifyRequest
  ): Promise<VerifyResponse> {
    return this.keyRepository
      .findOneOrFail({ where: { id, user } })
      .then(async (key) => {
        const jwk: KeyLike = (await importJWK(
          key.publicKey,
          'ES256'
        )) as KeyLike;
        const verify = createVerify(value.hashAlgorithm || 'sha256');
        verify.update(value.data);
        return {
          valid: verify.verify(jwk, value.signature, 'base64url'),
        };
      });
  }
}
