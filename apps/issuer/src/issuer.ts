import { CredentialIssuerMetadataOpts } from '@sphereon/oid4vci-common';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CredentialSchema } from './types.js';

/**
 * The issuer class is responsible for managing the credentials and the metadata of the issuer.
 */
export class Issuer {
  /**
   * The metadata of the issuer.
   */
  private metadata: CredentialIssuerMetadataOpts;

  /**
   * The credentials supported by the issuer.
   */
  private credentials: Map<string, CredentialSchema> = new Map();

  /**
   * Creates a new instance of the issuer.
   */
  constructor() {
    //instead of reading at the beginning, we could implement a read on demand.
    this.metadata = JSON.parse(
      readFileSync(join('templates', 'metadata.json'), 'utf-8')
    ) as CredentialIssuerMetadataOpts;
    this.metadata.credential_issuer = process.env.ISSUER_BASE_URL as string;

    if (!this.metadata.credentials_supported) {
      this.metadata.credentials_supported = [];
    }

    const files = readdirSync(join('templates', 'credentials'));
    for (const file of files) {
      //TODO: we should validate the schema
      const content = JSON.parse(
        readFileSync(join('templates', 'credentials', file), 'utf-8')
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
    const credential = this.credentials.get(id);
    if (!credential) {
      throw new Error(`The credential with the id ${id} is not supported.`);
    }
    return credential.schema;
  }

  /**
   * Returns the disclosure frame of the credential with the given id, throws an error if the credential is not supported.
   * @param id
   * @returns
   */
  getDisclosureFrame(id: string) {
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
    return this.metadata;
  }
}
