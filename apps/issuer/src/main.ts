import { KeyObject } from 'node:crypto';
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
import * as jose from 'jose';
import { JWK } from 'jose';
import { v4 } from 'uuid';
import { getKeys } from './keys.js';
import { disclosureFrame, metadata } from './metadata.js';
import { expressSupport } from './server.js';

const { privateKey, publicKey } = await getKeys();

const privateKeyLike = await jose.importJWK(privateKey);

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

const credentialDataSupplier: CredentialDataSupplier = async (args) => {
  const jwt = jose.decodeJwt(args.credentialRequest.proof?.jwt as string);
  const credential: SdJwtDecodedVerifiableCredentialPayload = {
    iat: new Date().getTime(),
    iss: args.credentialOffer.credential_offer.credential_issuer,
    vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
    jti: v4(),
    ...args.credentialDataSupplierInput.credentialSubject,
    // validate this https://github.com/Sphereon-Opensource/OID4VCI/blob/dc70d5282479b18bcd691f99f88d6cd4ad15131f/packages/issuer/lib/VcIssuer.ts#L307
    // cnf: {
    //   jwk: jwt.jwk,
    // },
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
  return new jose.SignJWT({ ...jwt.payload })
    .setProtectedHeader({ ...jwt.header, alg: Alg.ES256, kid: privateKey.kid })
    .sign(privateKeyLike);
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
  const publicKey = await jose.importJWK(decoded.jwk as JWK);
  const result = await jose.jwtVerify(args.jwt, publicKey);
  const alg = result.protectedHeader.alg;
  return {
    alg,
    jwk: result.protectedHeader.jwk as JWK,
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
    disclosureFrame,
    { header: { kid: privateKey.kid } }
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
  const credentialSubject = req.body.credentialSubject ?? {
    prename: 'Max',
    surname: 'Mustermann',
  };
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

interface IssuerMetadata {
  issuer: string;
  jwks_uri?: string;
  jwks?: {
    keys: JWK[];
  };
}

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

// start the webserver.
expressSupport.start();
//print the routes, only for debugging purposes
if (process.env.NODE_ENV === 'development') {
  expressListRoutes(expressSupport.express);
}
