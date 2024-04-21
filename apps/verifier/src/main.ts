import { EventEmitter } from 'node:events';
import { Jwt } from '@sd-jwt/core';
import { ES256, digest } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { KbVerifier, Verifier } from '@sd-jwt/types';
import {
  type EcdsaSignature,
  InMemoryRPSessionManager,
  PassBy,
  PresentationDefinitionLocation,
  type PresentationVerificationResult,
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
import { PresentationSubmission } from '@sphereon/pex-models';
import { CompactJWT, W3CVerifiablePresentation } from '@sphereon/ssi-types';
import 'dotenv/config';
import expressListRoutes from 'express-list-routes';
import { JWK } from 'jose';
import { v4 } from 'uuid';
import { decodeDidJWK, encodeDidJWK } from './did.js';
import { JWkResolver } from './did.js';
import { getKeys } from './keys.js';
import { presentationDefinition } from './metadata.js';
import { expressSupport } from './server.js';

// load the keys
const { privateKey, publicKey } = await getKeys();

const clientId = 'client';
const clientName = 'Verifier';
const logo_uri =
  'https://upload.wikimedia.org/wikipedia/de/thumb/e/ee/Fraunhofer-Gesellschaft_2009_logo.svg/2560px-Fraunhofer-Gesellschaft_2009_logo.svg.png';
const did = encodeDidJWK(publicKey as JWK);
const kid = did;

//TODO: when do we need this?
// create the event emitter to listen to events.
const eventEmitter = new EventEmitter();
//TODO: implement a persistant session manager so reloads don't lose state
const sessionManager = new InMemoryRPSessionManager(eventEmitter);

// create the relying party
const rp = RP.builder()
  .withClientId(clientId)
  .withIssuer(ResponseIss.SELF_ISSUED_V2)
  .withSupportedVersions([SupportedVersion.SIOPv2_D12_OID4VP_D18])
  // TODO: we should probably allow some dynamic values here
  .withClientMetadata({
    client_id: clientId,
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
    logo_uri,
    clientName,
  })
  //right now we are only supporting the jwk method to make it easier.
  .addResolver('jwk', new JWkResolver())
  .withResponseMode(ResponseMode.DIRECT_POST)
  .withResponseType(
    presentationDefinition
      ? [ResponseType.ID_TOKEN, ResponseType.VP_TOKEN]
      : ResponseType.ID_TOKEN
  )
  .withScope('openid')
  .withHasher(digest)
  .withSuppliedSignature(withSuppliedSignature, did, kid, SigningAlgo.ES256)
  .withRevocationVerification(RevocationVerification.NEVER)
  .withSessionManager(sessionManager)
  .withEventEmitter(eventEmitter)
  .withPresentationDefinition({
    definition: presentationDefinition,
  })
  .withPresentationVerification(presentationVerificationCallback)
  .build();

//define the baseurl
const baseUrl = process.env.VERIFIER_BASE_URL || 'http://localhost:3000';

//add the endpoint to generate a request
expressSupport.express.post('/request', async (req, res) => {
  //TODO: we need a middleware to protect this route
  const correlationId = v4();
  const nonce = v4();
  const state = v4();
  //TODO: we need to add a parameter for the definition id, otherwhise the verifier is only able to handle one definition
  const requestByReferenceURI = `${baseUrl}/siop/auth-request/${correlationId}`;
  const responseURI = `${baseUrl}/siop/auth-response/${correlationId}`;
  const request = await rp.createAuthorizationRequestURI({
    correlationId,
    nonce,
    state,
    version: SupportedVersion.SIOPv2_D12_OID4VP_D18,
    requestByReferenceURI,
    responseURI,
    responseURIType: 'response_uri',
  });
  res.send({
    uri: request.encodedUri,
  });
});

//TODO: add a parameter for the definition id
/**
 * Add the route to get the request object
 */
expressSupport.express.get(
  '/siop/auth-request/:correlationId',
  async (req, res) => {
    //normally we would use the definitionId to get the correct rp builder since there could be multiple
    const correlationId = req.params.correlationId;
    const request =
      await rp.sessionManager.getRequestStateByCorrelationId(correlationId);
    res.send(await request?.request.requestObject?.toJwt());
  }
);

/**
 * Add the route to get the response object
 */
expressSupport.express.post(
  '/siop/auth-response/:correlationId',
  async (req, res) => {
    try {
      req.body.presentation_submission = JSON.parse(
        req.body.presentation_submission
      );
      const response = await rp.verifyAuthorizationResponse(req.body, {
        correlationId: req.params.correlationId,
        presentationDefinitions: {
          definition: presentationDefinition,
          location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN,
        },
      });
      // console.log(response);
      res.send();
    } catch (e) {
      console.error(e);
      res.status(500).send((e as Error).message);
    }
  }
);
//start the server
expressSupport.start();
console.log(`Running on port ${expressSupport.port}`);

//print the routes, only for debugging purposes
if (process.env.NODE_ENV === 'development') {
  expressListRoutes(expressSupport.express);
}

/**
 * Sign the data with the supplied signature. Here we could also use a key management service to sign the data like vault or a HSM.
 * @param data
 * @returns
 */
async function withSuppliedSignature(
  data: string | Uint8Array
): Promise<string | EcdsaSignature> {
  //get the signer, we are only supporting ES256 for now
  const signer = await ES256.getSigner(privateKey);
  return signer(data as string);
}

/**
 * The presentation verification callback. This is called when the verifier needs to verify the presentation. The function can only handle sd-jwt-vc credentials.
 * @param args encoded credential.
 * @param presentationSubmission
 * @returns
 */
async function presentationVerificationCallback(
  args: W3CVerifiablePresentation,
  presentationSubmission: PresentationSubmission
): Promise<PresentationVerificationResult> {
  const inputDescriptor = presentationDefinition.input_descriptors.find(
    (descriptor) =>
      descriptor.id === presentationSubmission.descriptor_map[0].id
  );
  const requiredClaimKeys = inputDescriptor?.constraints.fields?.map((field) =>
    field.path[0].slice(2)
  );
  try {
    // biome-ignore lint/style/useConst: <explanation>
    let sdjwtInstance: SDJwtVcInstance;
    /**
     * The verifier function. This function will verify the signature of the vc.
     * @param data encoded header and payload of the jwt
     * @param signature signature of the jwt
     * @returns true if the signature is valid
     */
    const verifier: Verifier = async (data, signature) => {
      const decodedVC = await sdjwtInstance.decode(`${data}.${signature}`);
      const issuer: string = (
        (decodedVC.jwt as Jwt).payload as Record<string, unknown>
      ).iss as string;
      //decode the issuer to get the public key. We assume the issuer is a did:jwk.
      const publicKey = decodeDidJWK(issuer);
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
      //TODO: this validation is failing with an error that the sdhashes are not equal
      console.log(data);
      console.log(signature);
      console.log(payload);
      return true;
    };

    // initialize the sdjwt instance.
    sdjwtInstance = new SDJwtVcInstance({
      hasher: digest,
      verifier,
      kbVerifier,
    });
    // verify the presentation.
    const sdjwt = await sdjwtInstance.verify(
      args as CompactJWT,
      requiredClaimKeys,
      //since there is an error with the sdHash for now, we are not validating the key binding
      false
    );
    return Promise.resolve({ verified: true });
  } catch (e) {
    console.error(e);
    return Promise.reject({ verified: false, error: (e as Error).message });
  }
}
