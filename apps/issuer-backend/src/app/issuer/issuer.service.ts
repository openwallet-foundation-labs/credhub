import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { digest, generateSalt } from '@sd-jwt/crypto-nodejs';
import { SDJwtVcInstance, SdJwtVcPayload } from '@sd-jwt/sd-jwt-vc';
import {
  CredentialRequestSdJwtVc,
  Jwt,
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
import { DBStates, KeyService } from '@credhub/relying-party-shared';
import { IssuerMetadata } from './types';
import { StatusService } from '../status/status.service';
import { SessionResponseDto } from './dto/session-response.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CNonceEntity } from './entities/c-nonce.entity';
import { URIStateEntity } from './entities/uri-state.entity';
import { CredentialOfferSessionEntity } from './entities/credential-offer-session.entity';
import { CryptoImplementation, CryptoService } from '@credhub/backend';
interface CredentialDataSupplierInput {
  credentialSubject: Record<string, unknown>;
  exp: number;
}

@Injectable()
export class IssuerService {
  private express: ExpressSupport;
  vcIssuer: VcIssuer<DIDDocument>;

  sessionMapper: Map<string, string> = new Map();

  private crypto: CryptoImplementation;

  constructor(
    private adapterHost: HttpAdapterHost<ExpressAdapter>,
    @Inject('KeyService') private keyService: KeyService,
    private issuerDataService: IssuerDataService,
    private credentialsService: CredentialsService,
    private statusService: StatusService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    @InjectRepository(CNonceEntity)
    private cNonceRepository: Repository<CNonceEntity>,
    @InjectRepository(URIStateEntity)
    private uriStateRepository: Repository<URIStateEntity>,
    @InjectRepository(CredentialOfferSessionEntity)
    private credentialOfferSessionRepository: Repository<CredentialOfferSessionEntity>
  ) {
    this.express = this.getExpressInstance();
    this.crypto = this.cryptoService.getCrypto();
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
      const credential = await this.issuerDataService.getCredential(
        credentialId
      );
      let exp: number | undefined;
      // we either use the passed exp value or the ttl of the credential. If none is set, the credential will not expire.
      if (values.exp) {
        //TODO: make sure that the exp is in seconds
        exp = values.exp;
      } else if (credential.value.ttl) {
        const expDate = new Date();
        expDate.setSeconds(expDate.getSeconds() + credential.value.ttl);
        exp = expDate.getTime();
      }
      exp = exp > 1e10 ? Math.floor(exp / 1000) : exp;

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
        credential_configuration_ids: [credential.id],
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
    // crearre the sd-jwt instance with the required parameters.
    const sdjwt = new SDJwtVcInstance({
      signer: this.keyService.signer,
      signAlg: this.crypto.alg,
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
        iat: Math.round(new Date().getTime() / 1000),
        iss: args.credentialOffer.credential_offer.credential_issuer,
        vct: (args.credentialRequest as CredentialRequestSdJwtVc).vct,
        jti: v4(),
        ...(args.credentialDataSupplierInput as CredentialDataSupplierInput)
          .credentialSubject,
        //TODO: can be removed when correct type is set in PEX
        status: status as unknown as { idx: number; uri: string },
        //TODO: validate that the seconds and not milliseconds are used
        exp: args.credentialDataSupplierInput.exp,
        nbf: args.credentialDataSupplierInput.nbf,
      };

      // map the credential id with the session because we will be not able to get the session id in the sign callback. We are using the pre auth code for now.
      this.sessionMapper.set(credential.jti as string, args.preAuthorizedCode);
      return Promise.resolve({
        credential,
        format: 'vc+sd-jwt',
      });
    };

    /**
     * Signer callback for the access token.
     * @param jwt header and payload of the jwt
     * @returns signed jwt
     */
    const signerCallback = async (jwt: Jwt): Promise<string> => {
      return this.keyService.signJWT(jwt.payload, {
        ...jwt.header,
        alg: this.crypto.alg,
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
        await this.issuerDataService.getDisclosureFrame(
          args.credential.vct as string
        ),
        { header: { kid: await this.keyService.getKid() } }
      );
      const sessionId = this.sessionMapper.get(args.credential.jti as string);
      this.sessionMapper.delete(args.credential.jti as string);
      await this.credentialsService.create({
        value: jwt,
        id: args.credential.jti as string,
        sessionId,
      });
      return jwt;
    };

    //create the issuer instance
    this.vcIssuer = new VcIssuer<DIDDocument>(
      this.issuerDataService.getMetadata(),
      {
        cNonceExpiresIn: 300,
        //TODO: use persistant session managements in production
        credentialOfferSessions: new DBStates<CredentialOfferSession>(
          this.credentialOfferSessionRepository
        ),
        cNonces: new DBStates<CNonceState>(this.cNonceRepository),
        uris: new DBStates<URIState>(this.uriStateRepository),
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
          //TODO: the expiration should be passed to the user so he knows when the token is not valid anymore and avoids using it.
          tokenExpiresIn: 300,
        },
        //TODO: not implemented yet
        //notificationOpts: {},
      },
    });
  }
}
