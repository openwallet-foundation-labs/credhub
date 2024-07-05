import { Inject, Injectable } from '@nestjs/common';
import { ES256, digest } from '@sd-jwt/crypto-nodejs';
import {
  JWK,
  JWTPayload,
  PassBy,
  PresentationVerificationCallback,
  PresentationVerificationResult,
  RP,
  ResponseIss,
  ResponseMode,
  ResponseType,
  RevocationVerification,
  Scope,
  SigningAlgo,
  SubjectType,
  SupportedVersion,
} from '@sphereon/did-auth-siop';
import { JWkResolver, encodeDidJWK } from './did';
import { RPInstance } from './types';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { KbVerifier, Verifier } from '@sd-jwt/types';
import { PresentationSubmission } from '@sphereon/pex-models';
import { W3CVerifiablePresentation, CompactJWT } from '@sphereon/ssi-types';
import { importJWK, jwtVerify } from 'jose';
import { InMemoryRPSessionManager } from './session-manager';
import { EventEmitter } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { KeyService } from '@credhub/relying-party-shared';
import { ResolverService } from '../resolver/resolver.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TemplatesService } from '../templates/templates.service';
import { Template } from '../templates/dto/template.dto';

@Injectable()
export class RelyingPartyManagerService {
  // map to store the relying parties
  private rp: Map<string, RPInstance> = new Map();
  //TODO: replace its with the nestjs event emitter
  private eventEmitter = new EventEmitter();
  private sessionManager: InMemoryRPSessionManager;

  constructor(
    @Inject('KeyService') private keyService: KeyService,
    private resolverService: ResolverService,
    private configService: ConfigService,
    private httpSerivce: HttpService,
    private templateService: TemplatesService
  ) {
    this.sessionManager = new InMemoryRPSessionManager(this.eventEmitter, {
      // maxAgeInSeconds: 10,
    });
  }

  /**
   * Get or create the relying party.
   * @param id
   * @returns
   */
  async getOrCreate(id: string) {
    let rp = this.rp.get(id);
    if (!rp) {
      rp = await this.buildRP(id);
      if (this.configService.get<boolean>('CONFIG_RELOAD')) {
        // checks every minute if the rp has active sessions. If there is none, the rp is removed. We want to do this so we can update the rp with new input without losing state. This approach could be improved since we are waiting around 4 minutes for the last finished request until the entries are removed.
        setInterval(async () => {
          this.remove(id);
        }, 1000 * 60);
      }
      this.rp.set(id, rp);
    }
    return rp;
  }

  /**
   * Removes a relying party. This is useful when the instance should be restarted with a new definition.
   * @param id
   */
  async remove(id: string, force = false) {
    const rp = this.rp.get(id);
    if (!rp) {
      return;
    }
    if (
      !force &&
      //the limit for a session is 5 minutes, so after this a session becomes idle an can be removed.
      !(await (rp.rp.sessionManager as InMemoryRPSessionManager).isIdle())
    ) {
      // we have active sessions, we don't want to remove the rp. But at this point we do not know if they have already finished it. We just know they are not over the maximum defined limit (default 5 minutes).
      return;
    }
    this.rp.delete(id);
  }

  // create the relying party
  private async buildRP(id: string) {
    const verifier = await this.templateService.getOne(id);
    if (!verifier) {
      throw new Error(`The verifier with the id ${id} is not supported.`);
    }
    const did = encodeDidJWK(await this.keyService.getPublicKey());

    const rp = RP.builder()
      .withClientId(verifier.metadata.clientId)
      .withIssuer(ResponseIss.SELF_ISSUED_V2)
      .withSupportedVersions([SupportedVersion.SIOPv2_D12_OID4VP_D18])
      // TODO: we should probably allow some dynamic values here
      .withClientMetadata({
        client_id: verifier.metadata.clientId,
        idTokenSigningAlgValuesSupported: [SigningAlgo.ES256],
        requestObjectSigningAlgValuesSupported: [SigningAlgo.ES256],
        responseTypesSupported: [ResponseType.ID_TOKEN],
        vpFormatsSupported: {
          'vc+sd-jwt': {
            'sd-jwt_alg_values': [SigningAlgo.ES256],
            'kb-jwt_alg_values': [SigningAlgo.ES256],
          },
        },
        scopesSupported: [Scope.OPENID_DIDAUTHN, Scope.OPENID],
        subjectTypesSupported: [SubjectType.PAIRWISE],
        subject_syntax_types_supported: ['did:jwk'],
        passBy: PassBy.VALUE,
        logo_uri: verifier.metadata.logo_uri,
        clientName: verifier.metadata.clientName,
      })
      //right now we are only supporting the jwk method to make it easier.
      .addResolver('jwk', new JWkResolver())
      .withResponseMode(ResponseMode.DIRECT_POST)
      .withResponseType([ResponseType.ID_TOKEN, ResponseType.VP_TOKEN])
      .withScope('openid')
      .withHasher(digest)
      //TODO: right now the verifier sdk only supports did usage
      .withSuppliedSignature(
        this.keyService.signer as any,
        did,
        did,
        SigningAlgo.ES256
      )
      .withSessionManager(this.sessionManager)
      .withEventEmitter(this.eventEmitter)
      .withPresentationDefinition({
        definition: verifier.request,
      })
      //we are doing the revocation check inside the presentation check
      .withRevocationVerification(RevocationVerification.NEVER)
      .withPresentationVerification(this.getCall(verifier))
      .build();
    return {
      rp,
      verifier,
    };
  }

  getDefinition(id: string) {
    const rp = this.rp.get(id);
    if (!rp) {
      throw new Error(`The verifier with the id ${id} is not supported.`);
    }
    return rp.verifier;
  }

  getCall(verifier: Template): PresentationVerificationCallback {
    /**
     * The presentation verification callback. This is called when the verifier needs to verify the presentation. The function can only handle sd-jwt-vc credentials.
     * @param args encoded credential.
     * @param presentationSubmission
     * @returns
     */
    return async (
      args: W3CVerifiablePresentation,
      presentationSubmission: PresentationSubmission
    ): Promise<PresentationVerificationResult> => {
      const inputDescriptor = verifier.request.input_descriptors.find(
        (descriptor) =>
          descriptor.id === presentationSubmission.descriptor_map[0].id
      );
      const requiredClaimKeys = inputDescriptor?.constraints.fields?.map(
        (field) => field.path[0].slice(2)
      );
      try {
        // eslint-disable-next-line prefer-const
        let sdjwtInstance: SDJwtVcInstance;
        /**
         * The verifier function. This function will verify the signature of the vc.
         * @param data encoded header and payload of the jwt
         * @param signature signature of the jwt
         * @returns true if the signature is valid
         */
        const verifier: Verifier = async (data, signature) => {
          const decodedVC = await sdjwtInstance.decode(`${data}.${signature}`);
          const payload = decodedVC.jwt?.payload as JWTPayload;
          const header = decodedVC.jwt?.header as JWK;
          const publicKey = await this.resolverService.resolvePublicKey(
            payload,
            header
          );
          const verify = await ES256.getVerifier(publicKey);
          return verify(data, signature);
        };

        /**
         * The kb verifier function. This function will verify the signature for the key binding
         * @param data
         * @param signature
         * @param payload
         * @returns
         */
        const kbVerifier: KbVerifier = async (data, signature, payload) => {
          if (!payload.cnf) {
            throw new Error('No cnf found in the payload');
          }
          const key = await importJWK(payload.cnf.jwk as JWK, 'ES256');
          return jwtVerify(`${data}.${signature}`, key).then(
            () => true,
            () => false
          );
        };

        /**
         * Fetch the status list from the uri.
         * @param uri
         * @returns
         */
        const statusListFetcher: (uri: string) => Promise<string> = async (
          uri: string
        ) => {
          const response = await firstValueFrom(this.httpSerivce.get(uri));
          return response.data;
        };

        const statusValidator: (status: number) => Promise<void> = async (
          number: number
        ) => {
          console.log(number);
        };

        // initialize the sdjwt instance.
        sdjwtInstance = new SDJwtVcInstance({
          hasher: digest,
          verifier,
          kbVerifier,
          statusListFetcher,
          // statusValidator,
        });
        // verify the presentation.
        await sdjwtInstance.verify(args as CompactJWT, requiredClaimKeys, true);
        return Promise.resolve({ verified: true });
      } catch (e) {
        return Promise.reject({ verified: false, error: (e as Error).message });
      }
    };
  }
}
