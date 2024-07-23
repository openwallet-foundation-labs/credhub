import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { digest } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import {
  OP,
  type PresentationDefinitionWithLocation,
  PresentationExchange,
  type PresentationSignCallback,
  ResponseIss,
  SigningAlgo,
  SupportedVersion,
  VPTokenLocation,
  type VerifiedAuthorizationRequest,
  RPRegistrationMetadataPayload,
} from '@sphereon/did-auth-siop';
import { SdJwtDecodedVerifiableCredentialWithKbJwtInput } from '@sphereon/pex';
import { v4 as uuid } from 'uuid';
import { Oid4vpParseRepsonse } from './dto/parse-response.dto';
import { Oid4vpParseRequest } from './dto/parse-request.dto';
import { CompactSdJwtVc } from '@sphereon/ssi-types';
import { CredentialsService } from '../../credentials/credentials.service';
import { HistoryService } from '../../history/history.service';
import { KeysService } from '../../keys/keys.service';
import { JWkResolver } from '@credhub/relying-party-shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VPSessionEntity } from './entities/vp-session.entity';

@Injectable()
export class Oid4vpService {
  private sdjwt: SDJwtVcInstance;

  constructor(
    @Inject('KeyService') private keysService: KeysService,
    private credentialsService: CredentialsService,
    private historyService: HistoryService,
    @InjectRepository(VPSessionEntity)
    private sessionRepository: Repository<VPSessionEntity>
  ) {
    this.sdjwt = new SDJwtVcInstance({ hasher: digest });
  }

  async parse(
    data: Oid4vpParseRequest,
    user: string
  ): Promise<Oid4vpParseRepsonse> {
    const sessionId = uuid();
    const op = await this.getOp(user);

    //parse the uri
    const parsedAuthReqURI = await op.parseAuthorizationRequestURI(data.url);
    const verifiedAuthReqWithJWT: VerifiedAuthorizationRequest =
      await op.verifyAuthorizationRequest(
        parsedAuthReqURI.requestObjectJwt as string,
        {}
      );
    const issuer =
      (
        verifiedAuthReqWithJWT.authorizationRequestPayload
          .client_metadata as RPRegistrationMetadataPayload
      ).client_name ?? verifiedAuthReqWithJWT.issuer;
    const logo = verifiedAuthReqWithJWT.registrationMetadataPayload.logo_uri;
    await this.historyService.add(sessionId, user, issuer, logo, data.url);

    // get all credentials from the client, required for the presentation exchange
    const credentials = (await this.credentialsService.findAll(user)).map(
      (entry) => entry.value
    );
    //init the pex instance
    const pex = new PresentationExchange({
      allVerifiableCredentials: credentials,
      hasher: digest,
    });

    //gets the presentation definitions from the request
    const pds: PresentationDefinitionWithLocation[] =
      await PresentationExchange.findValidPresentationDefinitions(
        verifiedAuthReqWithJWT.authorizationRequestPayload
      );
    // throws in error in case none was provided
    if (pds.length === 0) {
      throw new Error('No matching credentials found');
    }

    await this.sessionRepository.save(
      this.sessionRepository.create({
        id: sessionId,
        // we need to store the JWT, because it serializes an object that can not be stored in the DB
        requestObjectJwt: parsedAuthReqURI.requestObjectJwt as string,
        user,
        pds,
      })
    );

    // select the credentials for the presentation
    const result = await pex
      .selectVerifiableCredentialsForSubmission(pds[0].definition)
      .catch((err) => {
        console.log(err);
        //instead of throwing an error, we return an empty array. This allows the user to show who sent the request for what.
        return { verifiableCredential: [] };
      });

    // decoding the credentials and add the required information
    const creds = [];
    for (const matchedCredential of result.verifiableCredential) {
      const sdjwtvc = await this.sdjwt.decode(matchedCredential as string);
      creds.push({
        vct: sdjwtvc.jwt.payload.vct,
        iss: sdjwtvc.jwt.payload.iss,
        jti: sdjwtvc.jwt.payload.jti,
      });
    }
    const requests = pds[0].definition.input_descriptors.map(
      (inputDescriptor) => {
        return {
          purpose: inputDescriptor.purpose,
          id: inputDescriptor.id,
          credentials: creds,
        };
      }
    );

    //return the credentials
    return {
      rp: {
        name: verifiedAuthReqWithJWT.registrationMetadataPayload.client_name,
        logo: verifiedAuthReqWithJWT.registrationMetadataPayload.logo_uri,
      },
      purpose: pds[0].definition.purpose,
      requests,
      sessionId,
    };
  }

  async accept(
    sessionId: string,
    user: string,
    value: Record<string, string>
  ): Promise<void> {
    // get the session, throw an error if not found
    const session = await this.sessionRepository.findOneBy({ id: sessionId });
    if (session.user !== user) {
      throw new ConflictException('Session not found');
    }

    const op = await this.getOp(user);

    //technically we do not need to verify it again, but for now it's easier when using a db as a persisted store.
    const verifiedAuthReqWithJWT: VerifiedAuthorizationRequest =
      await op.verifyAuthorizationRequest(session.requestObjectJwt, {});

    /**
     * The presentation sign callback. This is called when the verifier needs to sign the presentation.
     * @param args
     * @returns
     */
    const presentationSignCallback: PresentationSignCallback = async (args) => {
      const kbJwt = (
        args.presentation as SdJwtDecodedVerifiableCredentialWithKbJwtInput
      ).kbJwt;
      args.selectedCredentials[0];
      const aud = verifiedAuthReqWithJWT.authorizationRequest.payload.client_id;
      const cnf = args.presentation.decodedPayload.cnf;
      const signwedKbJwt = await this.keysService.signkbJwt(
        user,
        cnf.jwk.kid,
        kbJwt,
        aud
      );
      return `${args.presentation.compactSdJwtVc}${signwedKbJwt}`;
    };

    // get the credentials from the user based on the passed ids
    const credentials = [];
    for (const key of Object.keys(value)) {
      const credential = await this.credentialsService
        .findOne(value[key], user)
        .then((entry) => entry.value);
      credentials.push(credential);
    }

    //init the pex instance
    const pex = new PresentationExchange({
      allVerifiableCredentials: credentials,
      hasher: digest,
    });

    const verifiablePresentationResult = await pex.createVerifiablePresentation(
      session.pds[0].definition,
      // we can only pass one credential to the presentation since the PEX lib has this limitation for now: https://github.com/Sphereon-Opensource/PEX/issues/149
      credentials,
      presentationSignCallback,
      {
        proofOptions: {
          nonce: verifiedAuthReqWithJWT.authorizationRequestPayload.nonce,
        },
      }
    );

    const authenticationResponseWithJWT = await op.createAuthorizationResponse(
      verifiedAuthReqWithJWT,
      {
        presentationExchange: {
          verifiablePresentations: [
            verifiablePresentationResult.verifiablePresentation,
          ],
          vpTokenLocation: VPTokenLocation.AUTHORIZATION_RESPONSE,
          presentationSubmission:
            verifiablePresentationResult.presentationSubmission,
        },
      }
    );
    await op.submitAuthorizationResponse(authenticationResponseWithJWT);
    const response = authenticationResponseWithJWT.response.payload
      .vp_token as CompactSdJwtVc;
    await this.historyService.accept(sessionId, response);

    await this.sessionRepository.remove(session);
  }

  /**
   * Deletes the session of a user since he declined the request
   * @param id
   * @param user
   */
  async decline(id: string, user: string) {
    const session = await this.sessionRepository.findOneBy({ id });
    if (!session || session.user !== user) {
      throw new ConflictException('Session not found');
    }
    await this.historyService.decline(id);
    await this.sessionRepository.remove(session);
  }

  private async getOp(user: string) {
    const key = await this.keysService.firstOrCreate(user);
    const did = this.keysService.encodeDidJWK(key.publicKey);
    const kid = key.id;
    const alg = SigningAlgo.ES256;

    const withSuppliedSignature = async (data: string | Uint8Array) => {
      const signature = await this.keysService.sign(kid, user, {
        data: data as string,
      });
      return signature;
    };

    return OP.builder()
      .withExpiresIn(1000)
      .withHasher(digest)
      .withIssuer(ResponseIss.SELF_ISSUED_V2)
      .addResolver('jwk', new JWkResolver())
      .withSuppliedSignature(withSuppliedSignature, did, kid, alg)
      .withSupportedVersions(SupportedVersion.SIOPv2_D12_OID4VP_D18)
      .build();
  }
}
