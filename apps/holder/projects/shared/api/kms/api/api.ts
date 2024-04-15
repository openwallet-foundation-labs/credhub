export * from './credentials.service';
import { CredentialsApiService } from './credentials.service';
export * from './keys.service';
import { KeysApiService } from './keys.service';
export * from './oid4vci.service';
import { Oid4vciApiService } from './oid4vci.service';
export * from './oid4vcp.service';
import { Oid4vcpApiService } from './oid4vcp.service';
export const APIS = [CredentialsApiService, KeysApiService, Oid4vciApiService, Oid4vcpApiService];
