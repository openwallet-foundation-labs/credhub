import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { digest } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { OpenID4VCIClient } from '@sphereon/oid4vci-client';
import {
  Alg,
  CredentialOfferPayloadV1_0_13,
  EndpointMetadataResultV1_0_13,
  GrantTypes,
  IssuerMetadataV1_0_13,
  JwtVerifyResult,
  type CredentialConfigurationSupported,
  type CredentialSupportedSdJwtVc,
  type Jwt,
  type MetadataDisplay,
  type ProofOfPossessionCallbacks,
} from '@sphereon/oid4vci-common';
import { DIDDocument } from 'did-resolver';
import { v4 as uuid } from 'uuid';
import { Oid4vciParseRepsonse } from './dto/parse-response.dto';
import { Oid4vciParseRequest } from './dto/parse-request.dto';
import { decodeJwt } from 'jose';
import { CredentialsService } from '../../credentials/credentials.service';
import { KeysService } from '../../keys/keys.service';
import { AcceptRequestDto } from './dto/accept-request.dto';

type Session = {
  //instead of storing the client, we could also generate it on demand. In this case we need to store the uri
  client: OpenID4VCIClient;
  relyingParty: string;
  credentials: CredentialConfigurationSupported[];
  issuer: MetadataDisplay;
  created: Date;
  pinRequired: boolean;
};

@Injectable()
export class Oid4vciService {
  sessions: Map<string, Session> = new Map();

  sdjwt: SDJwtVcInstance;

  constructor(
    private credentialsService: CredentialsService,
    @Inject('KeyService') private keysService: KeysService
  ) {
    this.sdjwt = new SDJwtVcInstance({ hasher: digest });
  }

  async parse(data: Oid4vciParseRequest): Promise<Oid4vciParseRepsonse> {
    if (data.url.startsWith('openid-credential-offer')) {
      const client = await OpenID4VCIClient.fromURI({
        uri: data.url,
        retrieveServerMetadata: true,
      });
      // get the credential offer
      const metadata =
        (await client.retrieveServerMetadata()) as EndpointMetadataResultV1_0_13;
      const supportedCredentials = (
        metadata.credentialIssuerMetadata as IssuerMetadataV1_0_13
      ).credential_configurations_supported;
      const credentials = (
        client.credentialOffer.credential_offer as CredentialOfferPayloadV1_0_13
      ).credential_configuration_ids.map(
        (credential) => supportedCredentials[credential]
      );
      const id = uuid();
      if (!data.noSession) {
        this.sessions.set(id, {
          client,
          relyingParty: client.getIssuer(),
          credentials,
          //allows use to remove the session after a certain time
          created: new Date(),
          issuer: metadata.credentialIssuerMetadata.display[0],
          pinRequired: client.credentialOffer.userPinRequired,
        });
      }
      return {
        sessionId: id,
        credentials,
        issuer: metadata.credentialIssuerMetadata.display,
        txCode:
          client.credentialOffer.credential_offer.grants?.[
            GrantTypes.PRE_AUTHORIZED_CODE
          ]?.tx_code,
      };
    }
  }

  async accept(accept: AcceptRequestDto, user: string) {
    const data = this.sessions.get(accept.id);
    if (!data) {
      throw new Error('Session not found');
    }

    //use the first key, can be changed to use a specific or unique key
    const key = await this.keysService.firstOrCreate(user);
    const proofCallbacks: ProofOfPossessionCallbacks<DIDDocument> = {
      verifyCallback: async (args: {
        jwt: string;
      }): Promise<JwtVerifyResult<DIDDocument>> =>
        Promise.resolve({
          jwt: decodeJwt(args.jwt),
          alg: Alg.ES256,
          //instead of using the key referene, we could extract the key from the jwt
          jwk: key.publicKey,
        }),
      signCallback: async (args: Jwt): Promise<string> =>
        this.keysService.proof(user, {
          payload: args.payload,
          kid: key.id,
        }),
    };

    if (data.pinRequired && !accept.txCode) {
      throw new ConflictException('PIN required');
    }

    await data.client.acquireAccessToken({ pin: accept.txCode });
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
      this.sessions.delete(accept.id);
      return { id: credentialEntry.id };
    }
  }
}
