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
  type CredentialSupportedSdJwtVc,
  type Jwt,
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
import { InjectRepository } from '@nestjs/typeorm';
import { VCISessionEntity } from './entities/vci-session.entity';
import { Repository } from 'typeorm';

@Injectable()
export class Oid4vciService {
  private sdjwt: SDJwtVcInstance;

  constructor(
    private credentialsService: CredentialsService,
    @Inject('KeyService') private keysService: KeysService,
    @InjectRepository(VCISessionEntity)
    private sessionRepository: Repository<VCISessionEntity>
  ) {
    this.sdjwt = new SDJwtVcInstance({ hasher: digest });
  }

  async parse(
    data: Oid4vciParseRequest,
    user: string
  ): Promise<Oid4vciParseRepsonse> {
    if (data.url.startsWith('openid-credential-offer')) {
      const client = await OpenID4VCIClient.fromURI({
        uri: data.url,
        retrieveServerMetadata: true,
      });
      // get the credential offer
      const metadata =
        (await client.retrieveServerMetadata()) as EndpointMetadataResultV1_0_13;
      const credentials = this.getCredentials(client, metadata);
      const id = uuid();
      await this.sessionRepository.save(
        this.sessionRepository.create({
          id,
          state: await client.exportState(),
          user,
        })
      );
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

  private getCredentials(
    client: OpenID4VCIClient,
    metadata: EndpointMetadataResultV1_0_13
  ) {
    const supportedCredentials = (
      metadata.credentialIssuerMetadata as IssuerMetadataV1_0_13
    ).credential_configurations_supported;
    return (
      client.credentialOffer.credential_offer as CredentialOfferPayloadV1_0_13
    ).credential_configuration_ids.map(
      (credential) => supportedCredentials[credential]
    );
  }

  async accept(accept: AcceptRequestDto, user: string) {
    const session = await this.sessionRepository.findOneBy({
      id: accept.id,
    });

    if (!session || session.user !== user) {
      throw new ConflictException('Invalid session');
    }
    const client = await OpenID4VCIClient.fromState({ state: session.state });

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

    if (client.credentialOffer.userPinRequired && !accept.txCode) {
      throw new ConflictException('PIN required');
    }

    await client.acquireAccessToken({ pin: accept.txCode });

    const metadata =
      (await client.retrieveServerMetadata()) as EndpointMetadataResultV1_0_13;

    const credentials = this.getCredentials(client, metadata);

    for (const credential of credentials) {
      const credentialResponse = await client.acquireCredentials({
        credentialTypes: (credential as CredentialSupportedSdJwtVc).vct,
        proofCallbacks,
        alg: Alg.ES256,
        format: credential.format,
      });

      const sdjwtvc = await this.sdjwt.decode(
        credentialResponse.credential as string
      );
      const credentialEntry = await this.credentialsService.create(
        {
          value: credentialResponse.credential as string,
          id: sdjwtvc.jwt.payload.jti as string,
          metaData: credential,
          issuer: metadata.credentialIssuerMetadata.display[0],
        },
        user
      );
      /* if (credentialResponse.notification_id) {
        const res = await data.client.sendNotification(
          {},
          {
            notification_id: credentialResponse.notification_id,
            event: 'credential_accepted',
          }
        );
        console.log(res);
      } */

      //remove the old session
      await this.sessionRepository.delete({ id: accept.id });
      return { id: credentialEntry.id };
    }
  }
}
