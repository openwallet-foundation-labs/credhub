import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';
import { CredentialSchema } from './types.js';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplatesService } from '../templates/templates.interface';

/**
 * The issuer class is responsible for managing the credentials and the metadata of the issuer.
 * In case the CONFIG_REALOD environment variable is set, the issuer will reload the configuration every time a method is called.
 */
@Injectable()
export class IssuerDataService {
  /**
   * The metadata of the issuer.
   */
  private metadata!: CredentialIssuerMetadataOptsV1_0_13;

  /**
   * The credentials supported by the issuer.
   */
  private credentials: Map<string, CredentialSchema> = new Map();

  constructor(
    private configSerivce: ConfigService,
    @Inject('TemplatesService') private templatesService: TemplatesService
  ) {
    this.loadConfig();
  }

  public async loadConfig() {
    this.credentials.clear();
    const folder = this.configSerivce.get('CREDENTIALS_FOLDER');

    //instead of reading at the beginning, we could implement a read on demand.
    this.metadata = await this.templatesService.getMetadata();

    this.metadata.credential_issuer = this.configSerivce.get('ISSUER_BASE_URL');

    this.metadata.credential_configurations_supported =
      this.templatesService.getSupported(await this.templatesService.listAll());
  }

  /**
   * Returns the credential with the given id, throws an error if the credential is not supported.
   * @param id
   * @returns
   */
  getCredential(id: string) {
    if (this.configSerivce.get('CONFIG_RELOAD')) {
      this.loadConfig();
    }
    const credential = this.credentials.get(id);
    if (!credential) {
      throw new Error(`The credential with the id ${id} is not supported.`);
    }
    return credential;
  }

  /**
   * Returns the disclosure frame of the credential with the given id, throws an error if the credential is not supported.
   * @param id
   * @returns
   */
  getDisclosureFrame(id: string) {
    if (this.configSerivce.get('CONFIG_RELOAD')) {
      this.loadConfig();
    }
    const credential = this.credentials.get(id);
    if (!credential) {
      throw new Error(`The credential with the id ${id} is not supported.`);
    }
    return credential.sd;
  }

  /**
   * Returns the metadata of the issuer.
   */
  getMetadata() {
    if (this.configSerivce.get('CONFIG_RELOAD')) {
      this.loadConfig();
    }
    return this.metadata;
  }
}
