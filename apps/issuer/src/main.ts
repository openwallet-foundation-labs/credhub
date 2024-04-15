import { KeyObject } from 'node:crypto';
import { ES256, digest, generateSalt } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance, type SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc';
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
import * as jose from 'jose';
import { JWK } from 'jose';
import { v4 } from 'uuid';
import { getJWK } from './did.js';
import { encodeDidJWK } from './did.js';
import { getKeys } from './keys.js';
import { disclosureFrame, metadata } from './metadata.js';
import { expressSupport } from './server.js';

const { privateKey, publicKey } = await getKeys();

// get the signer and verifier. Only ES256 is supported for now.
const signer = await ES256.getSigner(privateKey);
const verifier = await ES256.getVerifier(publicKey);

// crearre the sd-jwt instance with the required parameters.
const sdjwt = new SDJwtVcInstance({
  signer,
  verifier,
  signAlg: 'EdDSA',
  hasher: digest,
  hashAlg: 'SHA-256',
  saltGenerator: generateSalt,
});

const issuer = encodeDidJWK(publicKey as JWK);

const credentialDataSupplier: CredentialDataSupplier = async (args) => {
  const claims = {
    prename: 'Mirko',
    surname: 'Mollik',
  };
  //TODO: add values from the request. They should be added when the request was created
  const credential: SdJwtDecodedVerifiableCredentialPayload = {
    iat: new Date().getTime(),
    iss: issuer,
    vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
    jti: v4(),
    ...claims,
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
  const privateKey = (await jose.generateKeyPair(Alg.ES256))
    .privateKey as KeyObject;
  return new jose.SignJWT({ ...jwt.payload })
    .setProtectedHeader({ ...jwt.header, alg: Alg.ES256 })
    .sign(privateKey);
};

/**
 * Extracts the DID from the key id and returns the DID document.
 * @param args jwt and key id
 * @returns the DID document
 */
async function jwtVerifyCallback(args: {
  jwt: string;
  kid?: string;
}): Promise<JwtVerifyResult<DIDDocument>> {
  //verify the jwt
  const decoded = jose.decodeProtectedHeader(args.jwt);
  const publicKey = await getJWK(decoded.kid as string);
  const result = await jose.jwtVerify(args.jwt, publicKey);
  const kid = result.protectedHeader.kid ?? (args.kid as string);
  const did = kid.split('#')[0];
  //TODO: do we need to extend the did document with more information? Like this is not the transformed did:jwk transformation to a did document since the key is missing.
  const didDocument: DIDDocument = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
  };
  const alg = result.protectedHeader.alg;
  return {
    alg,
    kid,
    did,
    didDocument,
    jwt: {
      header: result.protectedHeader,
      payload: result.payload,
    },
  };
}

/**
 * Signs the credential with the sd-jwt instance.
 * @param args credential to sign
 * @returns signed credential in a string format
 */
const credentialSignerCallback: CredentialSignerCallback<DIDDocument> = async (
  args
) => {
  //TODO: do we need to pass more values to manipulate the header to issue based on other args values? Maybe a reference to the used key?
  //TODO: can we pass a better value than any?
  // biome-ignore lint/suspicious/noExplicitAny: correct type passing is not implemented in the lib
  return sdjwt.issue<any>(
    args.credential as SdJwtDecodedVerifiableCredentialPayload,
    disclosureFrame
  );
};

//create the issuer instance
const vcIssuer: VcIssuer<DIDDocument> = new VcIssuer<DIDDocument>(metadata, {
  cNonceExpiresIn: 300,
  //TODO: use persistant session managements in production
  credentialOfferSessions: new MemoryStates<CredentialOfferSession>(),
  cNonces: new MemoryStates<CNonceState>(),
  uris: new MemoryStates<URIState>(),
  jwtVerifyCallback,
  credentialDataSupplier,
  credentialSignerCallback,
});

const vcIssuerServer = new OID4VCIServer(expressSupport, {
  issuer: vcIssuer,
  endpointOpts: {
    tokenEndpointOpts: {
      accessTokenSignerCallback: signerCallback,
      // accessTokenIssuer: 'https://www.example.com',
      preAuthorizedCodeExpirationDuration: 1000 * 60 * 10,
      tokenExpiresIn: 300,
    },
  },
});

/**
 * Register the route to create a credential offer.
 */
vcIssuerServer.router.post('/request', async (req, res) => {
  //TODO: in production this route should be protected with a middleware that checks the authorization header!
  const credentialSubject = req.body.credentialSubject ?? {};
  const response = await vcIssuer.createCredentialOfferURI({
    credentials: [metadata.credentials_supported[0].id as string],
    grants: {
      'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
        'pre-authorized_code': v4().substring(0, 10),
        user_pin_required: false,
      },
    },
    credentialDataSupplierInput: {
      credentialSubject,
      //TODO: allow to pass more values like should a status list be used. These values are defined be the issuer, not the holder that should receive the credential.
    },
  });
  //we are returning the response to the client
  res.send(response);
});

// start the webserver.
expressSupport.start();
//print the routes, only for debugging purposes
if (process.env.NODE_ENV === 'development') {
  expressListRoutes(expressSupport.express);
}
