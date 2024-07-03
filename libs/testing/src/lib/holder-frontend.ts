import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { KeycloakGlobalThis } from './keycloak';
import { BackendGlobalThis, gt } from './holder-backend';

export interface FrontendGlobalThis extends gt {
  backend: HolderFrontend;
}

/**
 * HolderBackend to manage the holder backend container
 */
export class HolderFrontend {
  instance!: StartedTestContainer;

  static async init() {
    const instance = new HolderFrontend();
    await instance.start();
    return instance;
  }

  /**
   * Start the holder backend container
   * @param network
   */
  async start() {
    this.instance = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-app'
    )
      .withExposedPorts(80)
      .withStartupTimeout(2000)
      .withName('holder-frontend')
      .withEnvironment({
        BACKEND_URL: `http://localhost:${(
          globalThis as BackendGlobalThis
        ).backend.instance.getMappedPort(3000)}`,
        OIDC_AUTH_URL: `http://host.testcontainers.internal:${(
          globalThis as KeycloakGlobalThis
        ).keycloak.instance.getMappedPort(8080)}/realms/wallet`,
        OIDC_CLIENT_ID: 'wallet',
        OIDC_ALLOW_HTTP: 'true',
      })
      .start();
  }

  async stop() {
    await this.instance.stop();
  }
}
