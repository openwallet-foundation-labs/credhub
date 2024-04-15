import { Injectable } from '@nestjs/common';
import { digest } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { OpenID4VCIClient } from '@sphereon/oid4vci-client';
import {
  Alg,
  type CredentialSupported,
  type CredentialSupportedSdJwtVc,
  type Jwt,
  type MetadataDisplay,
  type ProofOfPossessionCallbacks,
} from '@sphereon/oid4vci-common';
import { DIDDocument } from 'did-resolver';
import { CredentialsService } from 'src/credentials/credentials.service';
import { KeyResponse } from 'src/keys/dto/key-response.dto';
import { KeysService } from 'src/keys/keys.service';
import { v4 as uuid } from 'uuid';
import { Oid4vciParseRepsonse } from './dto/parse-response.dto';

type Session = {
  //instead of storing the client, we could also generate it on demand. In this case we need to store the uri
  client: OpenID4VCIClient;
  relyingParty: string;
  credentials: CredentialSupported[];
  issuer: MetadataDisplay;
  created: Date;
};

@Injectable()
export class Oid4vciService {
  sessions: Map<string, Session> = new Map();

  sdjwt: SDJwtVcInstance;

  constructor(
    private credentialsService: CredentialsService,
    private keysService: KeysService
  ) {
    this.sdjwt = new SDJwtVcInstance({ hasher: digest });
  }

  async parse(data: string): Promise<Oid4vciParseRepsonse> {
    if (data.startsWith('openid-credential-offer')) {
      const client = await OpenID4VCIClient.fromURI({
        uri: data,
        retrieveServerMetadata: true,
      });
      console.log(client);
      // get the credential offer
      const metadata = await client.retrieveServerMetadata();
      const supportedCredentials = metadata.credentialIssuerMetadata
        .credentials_supported as CredentialSupported[];
      const credentials =
        client.credentialOffer.credential_offer.credentials.map(
          (credential) => {
            return supportedCredentials.find(
              (supportedCredential) => supportedCredential.id === credential
            ) as CredentialSupported;
          }
        );
      const id = uuid();
      this.sessions.set(id, {
        client,
        relyingParty: client.getIssuer(),
        credentials,
        //allows use to remove the session after a certain time
        created: new Date(),
        issuer: metadata.credentialIssuerMetadata.display[0],
      });
      return {
        sessionId: id,
        credentials,
        issuer: metadata.credentialIssuerMetadata.display,
      };
    }
  }

  async accept(session: string, user: string) {
    const data = this.sessions.get(session);
    if (!data) {
      throw new Error('Session not found');
    }

    //use the first key, can be changed to use a specific or unique key
    const keys = await this.keysService.findAll(user);
    let key: KeyResponse;
    if (keys.length === 0) {
      key = await this.keysService.create({ type: 'ES256' }, user);
    } else {
      key = keys[0];
    }
    const proofCallbacks: ProofOfPossessionCallbacks<DIDDocument> = {
      // verifyCallback: async (args: {
      //   jwt: string;
      //   kid?: string;
      // }): Promise<JwtVerifyResult<DIDDocument>> => {
      //   console.log(args);
      //   return Promise.resolve({
      //     jwt: JSON.parse(args.jwt) as Jwt,
      //     alg: 'ES256',
      //   });
      // },
      signCallback: async (args: Jwt): Promise<string> => {
        return this.keysService
          .proof(user, {
            payload: args.payload,
            kid: key.id,
            aud: '',
          })
          .then((response) => response.jwt);
      },
    };
    await data.client.acquireAccessToken();
    for (const credential of data.credentials) {
      const credentialResponse = await data.client.acquireCredentials({
        credentialTypes: (credential as CredentialSupportedSdJwtVc).vct,
        proofCallbacks,
        alg: Alg.ES256,
        format: credential.format,
      });
      const sdjwtvc = await this.sdjwt.decode(
        credentialResponse.credential as string
      );
      //TODO: also save the reference to the credential metadata. This will allow use to render the credential later. Either save the metadata or save a reference so it can be loaded on demand.
      const credentialEntry = await this.credentialsService.create(
        {
          value: credentialResponse.credential as string,
          id: sdjwtvc.jwt.payload.jti as string,
          metaData: credential,
          issuer: data.issuer,
        },
        user
      );
      //remove the old session
      this.sessions.delete(session);
      return { id: credentialEntry.id };
    }
  }
}
