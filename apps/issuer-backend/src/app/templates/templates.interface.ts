import {
  CredentialConfigurationSupportedV1_0_13,
  CredentialIssuerMetadataOptsV1_0_13,
} from '@sphereon/oid4vci-common';
import { Template } from './dto/template.dto';
import { CredentialSchema } from '../issuer/types';

export abstract class TemplatesService {
  abstract getMetadata(): Promise<CredentialIssuerMetadataOptsV1_0_13>;
  abstract setMetadata(
    metadata: CredentialIssuerMetadataOptsV1_0_13
  ): Promise<void>;
  abstract listAll(): Promise<Map<string, CredentialSchema>>;

  getSupported(value: Map<string, CredentialSchema>) {
    //iterate over the map and change the value
    const result: Record<string, CredentialConfigurationSupportedV1_0_13> = {};
    value.forEach((v, k) => {
      result[k] = v.schema;
    });
    return result;
  }

  abstract getOne(id: string): Promise<CredentialSchema>;
  abstract create(data: Template): Promise<void>;
  abstract update(id: string, data: Template): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
