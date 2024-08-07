import { ConflictException, Injectable } from '@nestjs/common';
import { JWK, JWTPayload } from 'jose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { X509Certificate } from 'node:crypto';
import { Resolver } from 'did-resolver';
import web from 'web-did-resolver';

const webResolver = web.getResolver();
const resolver = new Resolver({
  ...webResolver,
});

interface IssuerMetadata {
  issuer: string;
  jwks: {
    keys: JWK[];
  };
}
@Injectable()
export class ResolverService {
  constructor(private httpService: HttpService) {}

  /**
   * Resolve the public key from the issuer, the function will first check for the x5c header, then for the did document and finally for the issuer metadata.
   * @param payload
   * @param header
   * @returns
   */
  async resolvePublicKey(payload: JWTPayload, header: JWK): Promise<JWK> {
    if (!payload.iss) {
      throw new Error('Issuer not found');
    }

    if (header.x5c) {
      //TODO: validate the certificate and the chain of trust!
      const certs = header.x5c.map(
        (cert) => new X509Certificate(Buffer.from(cert, 'base64'))
      );
      const cert = certs[0];
      if (!cert.subjectAltName?.includes(payload.iss.split('://')[1])) {
        throw new Error('Subject and issuer do not match');
      }
      return cert.publicKey.export({ format: 'jwk' }) as JWK;
    }
    //checl if the key is in the header as jwk
    if (header['jwk']) {
      return header['jwk'] as JWK;
    }

    //check if the issuer is a did
    if (payload.iss.startsWith('did:')) {
      const did = await resolver.resolve(payload.iss);
      if (!did.didDocument?.verificationMethod) {
        throw new ConflictException('DID not found');
      }
      //TODO: header.kid can be relative or absolute, we need to handle this
      const key = did.didDocument.verificationMethod.find(
        (vm) => vm.id === header.kid
      );
      if (!key) {
        throw new ConflictException('Key not found in DID document');
      }
      if (!key.publicKeyJwk) {
        throw new ConflictException(
          'Public key not found, we are only supporting JWK keys for now.'
        );
      }
      return key.publicKeyJwk;
    }

    const response = await firstValueFrom(
      this.httpService.get<IssuerMetadata>(
        `${payload.iss}/.well-known/jwt-vc-issuer`
      )
    ).then(
      (r) => r.data,
      () => {
        throw new ConflictException('Issuer not reachable');
      }
    );
    const key = response.jwks.keys.find((key) => key.kid === header.kid);
    if (!key) {
      throw new Error('Key not found');
    }
    return key;
  }
}
