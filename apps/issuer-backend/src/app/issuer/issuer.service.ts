import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ES256, digest, generateSalt } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance, SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc';
import {
  CredentialRequestSdJwtVc,
  Jwt,
  Alg,
  JwtVerifyResult,
  CredentialOfferSession,
  CNonceState,
  URIState,
} from '@sphereon/oid4vci-common';
import {
  CredentialDataSupplier,
  CredentialSignerCallback,
  VcIssuer,
  MemoryStates,
} from '@sphereon/oid4vci-issuer';
import { OID4VCIServer } from '@sphereon/oid4vci-issuer-server';
import { SdJwtDecodedVerifiableCredentialPayload } from '@sphereon/ssi-types';
import { DIDDocument } from 'did-resolver';
import { importJWK, decodeProtectedHeader, JWK, jwtVerify } from 'jose';
import { v4 } from 'uuid';
import {
  ExpressBuilder,
  ExpressCorsConfigurer,
  ExpressSupport,
} from '@sphereon/ssi-express-support';
import { IssuerDataService } from './issuer-data.service';
import { SessionRequestDto } from './dto/session-request.dto';
import { CredentialsService } from '../credentials/credentials.service';
import { KeyService } from '@my-wallet/relying-party-shared';
import { IssuerMetadata } from './types';
import { StatusService } from '../status/status.service';

@Injectable()
export class IssuerService implements OnModuleInit {
  private express: ExpressSupport;
  vcIssuer: VcIssuer<DIDDocument>;
  constructor(
    private adapterHost: HttpAdapterHost<ExpressAdapter>,
    @Inject('KeyService') private keyService: KeyService,
    private issuerDataService: IssuerDataService,
    private credentialsService: CredentialsService,
    private statusService: StatusService
  ) {
    this.express = this.getExpressInstance();
  }
  async onModuleInit() {
    await this.init();
  }

  /**
   * Returns the issuer metadata.
   * @returns
   */
  async getIssuerMetadata(): Promise<IssuerMetadata> {
    return {
      issuer: process.env.ISSUER_BASE_URL as string,
      jwks: {
        keys: [await this.keyService.getPublicKey()],
      },
    };
  }

  async createRequest(values: SessionRequestDto) {
    const credentialId = values.credentialId;
    const sessionId = v4();
    try {
      const response = await this.vcIssuer.createCredentialOfferURI({
        credentials: [
          this.issuerDataService.getCredential(credentialId).id as string,
        ],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': sessionId,
            user_pin_required: values.pin,
          },
        },
        credentialDataSupplierInput: {
          credentialSubject: values.credentialSubject,
          //TODO: allow to pass more values like should a status list be used. These values are defined be the issuer, not the holder that should receive the credential.
        },
      });
      //we are returning the response to the client
      return response;
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  /**
   * Returns the express instance.
   * @returns
   */
  private getExpressInstance() {
    // create the express server
    const cors = new ExpressCorsConfigurer().allowOrigin('*');
    return ExpressBuilder.fromServerOpts({
      existingExpress: this.adapterHost.httpAdapter.getInstance(),
      port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
      hostname: '0.0.0.0',
    })
      .withCorsConfigurer(cors)
      .build({ startListening: false });
  }

  async init() {
    // get verifier. Only ES256 is supported for now.
    const verifier = await ES256.getVerifier(
      await this.keyService.getPublicKey()
    );

    // crearre the sd-jwt instance with the required parameters.
    const sdjwt = new SDJwtVcInstance({
      signer: this.keyService.signer,
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
      const status = await this.statusService.getEmptySlot();

      const credential: SdJwtDecodedVerifiableCredentialPayload = {
        iat: new Date().getTime(),
        iss: args.credentialOffer.credential_offer.credential_issuer,
        vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
        jti: v4(),
        ...args.credentialDataSupplierInput.credentialSubject,
        status: {
          status_list: status,
        },
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
      return this.keyService.signJWT(jwt.payload, {
        ...jwt.header,
        alg: Alg.ES256,
        kid: await this.keyService.getKid(),
      });
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
    const credentialSignerCallback: CredentialSignerCallback<
      DIDDocument
    > = async (args) => {
      const jwt = await sdjwt.issue<SdJwtVcPayload>(
        args.credential as unknown as SdJwtVcPayload,
        this.issuerDataService.getDisclosureFrame(
          args.credential.vct as string
        ),
        { header: { kid: await this.keyService.getKid() } }
      );
      await this.credentialsService.create({
        value: jwt,
        id: args.credential.jti as string,
      });
      return jwt;
    };

    //create the issuer instance
    this.vcIssuer = new VcIssuer<DIDDocument>(
      this.issuerDataService.getMetadata(),
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
    new OID4VCIServer(this.express, {
      issuer: this.vcIssuer,
      baseUrl: process.env.ISSUER_BASE_URL,
      endpointOpts: {
        tokenEndpointOpts: {
          accessTokenSignerCallback: signerCallback,
          accessTokenIssuer: process.env.ISSUER_BASE_URL,
          preAuthorizedCodeExpirationDuration: 1000 * 60 * 10,
          tokenExpiresIn: 300,
        },
      },
    });

    // start the webserver.
    // expressSupport.start();
    //print the routes, only for debugging purposes
    // if (process.env.NODE_ENV === 'development') {
    //   expressListRoutes(expressSupport.express);
    // }
  }
}
