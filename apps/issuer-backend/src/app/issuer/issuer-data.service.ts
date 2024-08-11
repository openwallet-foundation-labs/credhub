import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplatesService } from '../templates/template.service';
import { MetadataService } from '../templates/metadata.service';

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

  constructor(
    private configSerivce: ConfigService,
    private templatesService: TemplatesService,
    private metadataService: MetadataService
  ) {
    this.loadConfig();
  }

  public async loadConfig() {
    //instead of reading at the beginning, we could implement a read on demand.
    this.metadata = await this.metadataService.getMetadata();

    this.metadata.credential_issuer = this.configSerivce.get('ISSUER_BASE_URL');

    this.metadata.credential_configurations_supported =
      await this.templatesService.getSupported();
  }

  /**
   * Returns the credential with the given id, throws an error if the credential is not supported.
   * @param id
   * @returns
   */
  async getCredential(id: string) {
    if (this.configSerivce.get('CONFIG_RELOAD')) {
      this.loadConfig();
    }
    const credential = await this.templatesService.getOne(id);
    if (!credential) {
      throw new Error(`The credential with the id ${id} is not supported.`);
    }
    return credential;
  }

  /**
   * Returns the disclosure frame of the credential with the given id, throws an error if the credential is not supported.
   * @param vct
   * @returns
   */
  async getDisclosureFrame(vct: string) {
    if (this.configSerivce.get('CONFIG_RELOAD')) {
      this.loadConfig();
    }
    //becuase the vct is stored in a json field, we will need to fetch all elements and then filter
    const credential = await this.templatesService
      .listAll()
      .then((templates) =>
        templates.find((template) => template.value.schema.vct === vct)
      );
    if (!credential) {
      throw new Error(`The credential with the id ${vct} is not supported.`);
    }
    return credential.value.sd;
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
