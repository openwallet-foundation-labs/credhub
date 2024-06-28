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
  TxCode,
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
import { KeyService } from '@credhub/relying-party-shared';
import { IssuerMetadata } from './types';
import { StatusService } from '../status/status.service';
import { SessionResponseDto } from './dto/session-response.dto';
import { ConfigService } from '@nestjs/config';

interface CredentialDataSupplierInput {
  credentialSubject: Record<string, unknown>;
  exp: number;
}

@Injectable()
export class IssuerService implements OnModuleInit {
  private express: ExpressSupport;
  vcIssuer: VcIssuer<DIDDocument>;
  constructor(
    private adapterHost: HttpAdapterHost<ExpressAdapter>,
    @Inject('KeyService') private keyService: KeyService,
    private issuerDataService: IssuerDataService,
    private credentialsService: CredentialsService,
    private statusService: StatusService,
    private configService: ConfigService
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
      issuer: this.configService.get<string>('ISSUER_BASE_URL'),
      jwks: {
        keys: [await this.keyService.getPublicKey()],
      },
    };
  }

  async createRequest(values: SessionRequestDto): Promise<SessionResponseDto> {
    const credentialId = values.credentialId;
    const sessionId = v4();
    try {
      const credential = this.issuerDataService.getCredential(credentialId);
      let exp: number | undefined;
      // we either use the passed exp value or the ttl of the credential. If none is set, the credential will not expire.
      if (values.exp) {
        exp = values.exp;
      } else if (credential.ttl) {
        const expDate = new Date();
        expDate.setSeconds(expDate.getSeconds() + credential.ttl);
        exp = expDate.getTime();
      }

      const credentialDataSupplierInput: CredentialDataSupplierInput = {
        credentialSubject: values.credentialSubject,
        exp,
      };
      let tx_code: TxCode;
      if (values.pin) {
        tx_code = {
          input_mode: 'numeric',
          length: 6,
          description: 'Please enter the code',
        };
      }

      const response = await this.vcIssuer.createCredentialOfferURI({
        credential_configuration_ids: [credential.schema.id as string],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': sessionId,
            tx_code,
          },
        },
        credentialDataSupplierInput,
      });
      //we are returning the response to the client
      return {
        uri: response.uri,
        id: sessionId,
        userPin: response.userPin,
        status: 'CREATED',
      };
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
      port: this.configService.get<number>('PORT', 3000),
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
      const status_list = await this.statusService.getEmptySlot();
      const status = {
        status_list,
      };

      const credential: SdJwtDecodedVerifiableCredentialPayload = {
        iat: new Date().getTime(),
        iss: args.credentialOffer.credential_offer.credential_issuer,
        vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
        jti: v4(),
        ...(args.credentialDataSupplierInput as CredentialDataSupplierInput)
          .credentialSubject,
        //TODO: can be removed when correct type is set in PEX
        status: status as any,
        exp: args.credentialDataSupplierInput.exp,
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
      // return decodeSdJwtVc(jwt, digest) as unknown as Promise<CompactSdJwtVc>;
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
      baseUrl: this.configService.get<string>('ISSUER_BASE_URL'),
      endpointOpts: {
        tokenEndpointOpts: {
          accessTokenSignerCallback: signerCallback,
          accessTokenIssuer: this.configService.get<string>('ISSUER_BASE_URL'),
          preAuthorizedCodeExpirationDuration: 1000 * 60 * 10,
          tokenExpiresIn: 300,
        },
      },
    });
  }
}
