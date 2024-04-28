import { ConflictException, Injectable } from '@nestjs/common';
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
import { CredentialsService } from 'src/credentials/credentials.service';
import { KeysService } from 'src/keys/keys.service';
import { v4 as uuid } from 'uuid';
import { Oid4vpParseRepsonse } from './dto/parse-response.dto';
import { SubmissionRequest } from './dto/submission-request.dto';
import { HistoryService } from 'src/history/history.service';
import { Oid4vpParseRequest } from './dto/parse-request.dto';
import { Session } from './session';

@Injectable()
export class Oid4vpService {
  sessions: Map<string, Session> = new Map();
  sdjwt: SDJwtVcInstance;

  constructor(
    private credentialsService: CredentialsService,
    private keysService: KeysService,
    private historyService: HistoryService
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
        parsedAuthReqURI.requestObjectJwt as string
      );
    const issuer =
      (
        verifiedAuthReqWithJWT.authorizationRequestPayload
          .client_metadata as RPRegistrationMetadataPayload
      ).client_name ?? verifiedAuthReqWithJWT.issuer;
    const logo = verifiedAuthReqWithJWT.registrationMetadataPayload.logo_uri;
    if (!data.noSession) {
      await this.historyService.add(sessionId, user, issuer, logo, data.url);
    }

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

    if (!data.noSession) {
      // store the session
      this.sessions.set(sessionId, {
        user,
        verifiedAuthReqWithJWT,
        created: new Date(),
        pex,
        op,
        pd: pds[0],
      });
    }
    // select the credentials for the presentation
    const result = await pex.selectVerifiableCredentialsForSubmission(
      pds[0].definition
    );

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
    value: SubmissionRequest
  ): Promise<void> {
    // get the session, throw an error if not found
    const session = this.sessions.get(sessionId);
    if (!session || session.user !== user) {
      throw new ConflictException('Session not found');
    }

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
      const aud =
        session.verifiedAuthReqWithJWT.authorizationRequest.payload.client_id;
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
    const verifiablePresentationResult =
      await session.pex.createVerifiablePresentation(
        session.pd.definition,
        // we can only pass one credential to the presentation since the PEX lib has this limitation for now: https://github.com/Sphereon-Opensource/PEX/issues/149
        credentials,
        presentationSignCallback,
        {
          proofOptions: {
            nonce:
              session.verifiedAuthReqWithJWT.authorizationRequestPayload.nonce,
          },
        }
      );
    const authenticationResponseWithJWT =
      await session.op.createAuthorizationResponse(
        session.verifiedAuthReqWithJWT,
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
    const res = await session.op
      .submitAuthorizationResponse(authenticationResponseWithJWT)
      .catch(() => '');
    await this.historyService.setStatus(sessionId, 'accepted');
    this.sessions.delete(sessionId);
  }

  /**
   * Deletes the session of a user since he declined the request
   * @param id
   * @param user
   */
  async decline(id: string, user: string) {
    //TODO: document that the user declined it
    const session = this.sessions.get(id);
    if (!session || session.user !== user) {
      throw new ConflictException('Session not found');
    }
    await this.historyService.setStatus(id, 'declined');
    this.sessions.delete(id);
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
      .addDidMethod('jwk')
      .withSuppliedSignature(withSuppliedSignature, did, kid, alg)
      .withSupportedVersions(SupportedVersion.SIOPv2_D12_OID4VP_D18)
      .build();
  }
}
