import { CredentialIssuerMetadataOpts } from '@sphereon/oid4vci-common';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CredentialSchema } from './types.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * The issuer class is responsible for managing the credentials and the metadata of the issuer.
 * In case the CONFIG_REALOD environment variable is set, the issuer will reload the configuration every time a method is called.
 */
@Injectable()
export class IssuerDataService {
  /**
   * The metadata of the issuer.
   */
  private metadata!: CredentialIssuerMetadataOpts;

  /**
   * The credentials supported by the issuer.
   */
  private credentials: Map<string, CredentialSchema> = new Map();

  constructor(private configSerivce: ConfigService) {
    this.loadConfig();
  }

  public loadConfig() {
    this.credentials.clear();
    const folder = this.configSerivce.get('CREDENTIALS_FOLDER');

    //instead of reading at the beginning, we could implement a read on demand.
    this.metadata = JSON.parse(
      readFileSync(join(folder, 'metadata.json'), 'utf-8')
    ) as CredentialIssuerMetadataOpts;
    this.metadata.credential_issuer = this.configSerivce.get('ISSUER_BASE_URL');

    if (!this.metadata.credentials_supported) {
      this.metadata.credentials_supported = [];
    }

    const files = readdirSync(join(folder, 'credentials'));
    for (const file of files) {
      //TODO: we should validate the schema
      const content = JSON.parse(
        readFileSync(join(folder, 'credentials', file), 'utf-8')
      ) as CredentialSchema;
      //check if an id is already used
      if (this.credentials.has(content.schema.id as string)) {
        throw new Error(
          `The credential with the id ${content.schema.id} is already used.`
        );
      }
      this.credentials.set(content.schema.id as string, content);
      this.metadata.credentials_supported.push(content.schema);
    }
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
