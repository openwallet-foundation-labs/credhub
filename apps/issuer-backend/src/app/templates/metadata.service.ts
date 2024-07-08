import { Injectable } from '@nestjs/common';
import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetadataService {
  folder: string;
  constructor(private configSerivce: ConfigService) {
    this.folder = this.configSerivce.get('CREDENTIALS_FOLDER');
  }

  /**
   * Get the metadata for the credential issuer
   * @returns
   */
  getMetadata(): Promise<CredentialIssuerMetadataOptsV1_0_13> {
    const content = JSON.parse(
      readFileSync(join(this.folder, 'metadata.json'), 'utf-8')
    ) as CredentialIssuerMetadataOptsV1_0_13;
    return Promise.resolve(content);
  }

  /**
   * Set the metadata for the credential issuer
   * @param metadata
   * @returns
   */
  setMetadata(metadata: CredentialIssuerMetadataOptsV1_0_13): Promise<void> {
    writeFileSync(
      join(this.folder, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    return Promise.resolve(null);
  }
}
