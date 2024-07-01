import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  Network,
  StartedNetwork,
  StartedTestContainer,
  Wait,
} from 'testcontainers';
import { Client } from 'pg';
import { Keycloak } from './keycloak';

export type gt = typeof globalThis;
// extend globalThis with the keycloak instance
export interface KeycloakGlobalThis extends gt {
  keycloak: Keycloak;
}

/**
 * HolderBackend to manage the holder backend container
 */
export class HolderBackend {
  // Holder backend network
  network!: StartedNetwork;
  private postgresContainer!: StartedPostgreSqlContainer;
  private postgresClient!: Client;
  backend!: StartedTestContainer;

  static async init() {
    const instance = new HolderBackend();
    await instance.start();
    return instance;
  }

  /**
   * Start the holder backend container
   * @param network
   */
  async start() {
    this.network = await new Network().start();

    this.postgresContainer = await new PostgreSqlContainer()
      .withNetwork(this.network)
      .withName('postgres')
      .start();
    this.postgresClient = new Client({
      connectionString: this.postgresContainer.getConnectionUri(),
    });
    await this.postgresClient.connect();

    this.backend = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-backend'
    )
      .withNetwork(this.network)
      .withExposedPorts(3000)
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withName('holder-backend')
      .withEnvironment({
        OIDC_AUTH_URL: `http://host.testcontainers.internal:${(
          globalThis as KeycloakGlobalThis
        ).keycloak.instance.getMappedPort(8080)}`,
        OIDC_REALM: 'wallet',
        OIDC_PUBLIC_CLIENT_ID: 'wallet',
        OIDC_ADMIN_CLIENT_ID: 'wallet-admin',
        OIDC_ADMIN_CLIENT_SECRET: 'kwpCrguxUOn9gump77E0B3vAkiOhW8eL',
        DB_TYPE: 'postgres',
        DB_HOST: 'postgres',
        DB_PORT: '5432',
        DB_USERNAME: this.postgresContainer.getUsername(),
        DB_PASSWORD: this.postgresContainer.getPassword(),
        DB_NAME: this.postgresContainer.getDatabase(),
      })
      .start();
  }

  async stop() {
    await this.backend.stop();
    await this.postgresClient.end();
    await this.postgresContainer.stop();
    await this.network.stop();
  }
}
