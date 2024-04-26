import { ES256, digest, generateSalt } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import {
  Alg,
  type CNonceState,
  type CredentialOfferSession,
  type CredentialRequestSdJwtVc,
  type Jwt,
  type JwtVerifyResult,
  type URIState,
} from '@sphereon/oid4vci-common';
import {
  type CredentialDataSupplier,
  type CredentialSignerCallback,
  MemoryStates,
  VcIssuer,
} from '@sphereon/oid4vci-issuer';
import { OID4VCIServer } from '@sphereon/oid4vci-issuer-server';
import { SdJwtDecodedVerifiableCredentialPayload } from '@sphereon/ssi-types';
import { DIDDocument } from 'did-resolver';
import 'dotenv/config';
import expressListRoutes from 'express-list-routes';
import {
  JWK,
  SignJWT,
  decodeProtectedHeader,
  importJWK,
  jwtVerify,
} from 'jose';
import { v4 } from 'uuid';
import { getKeys } from './keys.js';
import { Issuer } from './issuer.js';
import { expressSupport } from './server.js';
import { IssuerMetadata } from './types.js';

// get the keys
const { privateKey, publicKey } = await getKeys();

// import the private key.
const privateKeyLike = await importJWK(privateKey);

// create the issuer instance
const issuer = new Issuer();

// get the signer and verifier. Only ES256 is supported for now.
const signer = await ES256.getSigner(privateKey);
const verifier = await ES256.getVerifier(publicKey);

// crearre the sd-jwt instance with the required parameters.
const sdjwt = new SDJwtVcInstance({
  signer,
  verifier,
  signAlg: 'ES256',
  hasher: digest,
  hashAlg: 'SHA-256',
  saltGenerator: generateSalt,
});

/**
 * The credential data supplier is responsible for creating the credential that should be issued.
 * @param args
 * @returns
 */
const credentialDataSupplier: CredentialDataSupplier = async (args) => {
  // const jwt = decodeJwt(args.credentialRequest.proof?.jwt as string);
  const credential: SdJwtDecodedVerifiableCredentialPayload = {
    iat: new Date().getTime(),
    iss: args.credentialOffer.credential_offer.credential_issuer,
    vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
    jti: v4(),
    ...args.credentialDataSupplierInput.credentialSubject,
  };
  return Promise.resolve({
    credential,
    format: 'vc+sd-jwt',
  });
};

/**
 * Signer callback for the access token.
 * @param jwt header and payload of the jwt
 * @param kid key id that should be used for signing
 * @returns signed jwt
 */
const signerCallback = async (jwt: Jwt, kid?: string): Promise<string> => {
  //TODO: use the kid to select the correct key
  return new SignJWT({ ...jwt.payload })
    .setProtectedHeader({ ...jwt.header, alg: Alg.ES256, kid: privateKey.kid })
    .sign(privateKeyLike);
};

/**
 * Extracts the DID from the key id and returns the DID document.
 * @param args jwt and key id
 * @returns the DID document
 */
const jwtVerifyCallback = async (args: {
  jwt: string;
  kid?: string;
}): Promise<JwtVerifyResult<DIDDocument>> => {
  //verify the jwt
  const decoded = decodeProtectedHeader(args.jwt);
  const publicKey = await importJWK(decoded.jwk as JWK);
  const result = await jwtVerify(args.jwt, publicKey);
  const alg = result.protectedHeader.alg;
  return {
    alg,
    jwk: result.protectedHeader.jwk as JWK,
    jwt: {
      header: result.protectedHeader,
      payload: result.payload,
    },
  };
};

/**
 * Signs the credential with the sd-jwt instance.
 * @param args credential to sign
 * @returns signed credential in a string format
 */
const credentialSignerCallback: CredentialSignerCallback<DIDDocument> = async (
  args
) =>
  sdjwt.issue<{ iss: string; vct: string }>(
    args.credential as SdJwtDecodedVerifiableCredentialPayload,
    issuer.getDisclosureFrame(args.credential.vct as string),
    { header: { kid: privateKey.kid } }
  );

//create the issuer instance
const vcIssuer: VcIssuer<DIDDocument> = new VcIssuer<DIDDocument>(
  issuer.getMetadata(),
  {
    cNonceExpiresIn: 300,
    //TODO: use persistant session managements in production
    credentialOfferSessions: new MemoryStates<CredentialOfferSession>(),
    cNonces: new MemoryStates<CNonceState>(),
    uris: new MemoryStates<URIState>(),
    jwtVerifyCallback,
    credentialDataSupplier,
    credentialSignerCallback,
  }
);

/**
 * Create the issuer server instance.
 */
const vcIssuerServer = new OID4VCIServer(expressSupport, {
  issuer: vcIssuer,
  endpointOpts: {
    tokenEndpointOpts: {
      accessTokenSignerCallback: signerCallback,
      accessTokenIssuer: process.env.ISSUER_BASE_URL,
      preAuthorizedCodeExpirationDuration: 1000 * 60 * 10,
      tokenExpiresIn: 300,
    },
  },
});

interface RequestLinkBody {
  credentialSubject: unknown;
  credentialId: string;
  pin: boolean;
}

/**
 * Register the route to create a credential offer.
 */
vcIssuerServer.router.post('/request', async (req, res) => {
  const values: RequestLinkBody = req.body;
  //TODO: in production this route should be protected with a middleware that checks the authorization header!
  const credentialSubject = values.credentialSubject ?? {
    prename: 'Max',
    surname: 'Mustermann',
  };
  const credentialId = values.credentialId;
  try {
    const response = await vcIssuer.createCredentialOfferURI({
      credentials: [issuer.getCredential(credentialId).id as string],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': v4().substring(0, 10),
          user_pin_required: values.pin,
        },
      },
      credentialDataSupplierInput: {
        credentialSubject,
        //TODO: allow to pass more values like should a status list be used. These values are defined be the issuer, not the holder that should receive the credential.
      },
    });
    //we are returning the response to the client
    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(402);
  }
});

/**
 * Returns the issuers metadata.
 */
expressSupport.express.get('/.well-known/jwt-vc-issuer', async (req, res) => {
  const metadata: IssuerMetadata = {
    issuer: process.env.ISSUER_BASE_URL as string,
    jwks: {
      keys: [publicKey as JWK],
    },
  };
  res.send(metadata);
});

expressSupport.express.get('/health', async (req, res) => {
  res.send('ok');
});

// start the webserver.
expressSupport.start();
//print the routes, only for debugging purposes
if (process.env.NODE_ENV === 'development') {
  expressListRoutes(expressSupport.express);
}
