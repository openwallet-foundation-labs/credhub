import { GlobalThisConfig } from './global-setup';

export default async function globalTeardown() {
  if (process.env['NO_CONTAINER']) {
    return;
  }
  const config = (globalThis as unknown as GlobalThisConfig).config;
  await config.keycloak.stop();
  await config.holderBackend.stop();
  await config.holderFrontend.stop();
  await config.issuerBackend.stop();
  await config.verifierBackend.stop();
}
