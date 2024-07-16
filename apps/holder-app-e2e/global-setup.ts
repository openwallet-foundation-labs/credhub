import {
  Keycloak,
  HolderBackend,
  HolderFrontend,
  IssuerBackend,
  VerifierBackend,
} from '@credhub/testing';
import { appendFileSync } from 'fs';

export interface GlobalConfig {
  holderFrontendPort: number;
  keycloakPort: number;
  verifierPort: number;
  issuerPort: number;
}

export const CONFIG_KEY = 'CONFIG';

export interface GlobalThisConfig {
  config: {
    keycloak: Keycloak;
    holderBackend: HolderBackend;
    holderFrontend: HolderFrontend;
    issuerBackend: IssuerBackend;
    verifierBackend: VerifierBackend;
  };
}

export default async function globalSetup() {
  if (process.env['NO_CONTAINER']) {
    process.env[CONFIG_KEY] = JSON.stringify({
      holderFrontendPort: 4200,
      keycloakPort: 8080,
      verifierPort: 3002,
      issuerPort: 3001,
    } as GlobalConfig);
  }

  const keycloak = await Keycloak.init();
  const holderBackend = await HolderBackend.init(keycloak);
  const holderFrontend = await HolderFrontend.init(holderBackend);
  const issuerBackend = await IssuerBackend.init(keycloak);
  const verifierBackend = await VerifierBackend.init(keycloak);
  const holderFrontendPort = holderFrontend.instance.getMappedPort(80);
  const keycloakPort = keycloak.instance.getMappedPort(8080);
  const verifierPort = verifierBackend.instance.getMappedPort(3000);
  const issuerPort = issuerBackend.instance.getMappedPort(3000);
  process.env[CONFIG_KEY] = JSON.stringify({
    holderFrontendPort,
    keycloakPort,
    verifierPort,
    issuerPort,
  } as GlobalConfig);
  (globalThis as unknown as GlobalThisConfig).config = {
    keycloak,
    holderBackend,
    holderFrontend,
    issuerBackend,
    verifierBackend,
  };
}
