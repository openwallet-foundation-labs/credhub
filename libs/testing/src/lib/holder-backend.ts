import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  Network,
  StartedNetwork,
  Wait,
} from 'testcontainers';
import { Client } from 'pg';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';

/**
 * HolderBackend to manage the holder backend container
 */
export class HolderBackend {
  // Holder backend network
  static network: StartedNetwork;
  private static postgresContainer: StartedPostgreSqlContainer;

  /**
   * Start the holder backend container
   * @param network
   */
  static async start() {
    this.network = await new Network().start();

    this.postgresContainer = await new PostgreSqlContainer()
      .withNetwork(this.network)
      .withName('postgres')
      .start();
    globalThis.postgresClient = new Client({
      connectionString: this.postgresContainer.getConnectionUri(),
    });
    await globalThis.postgresClient.connect();

    globalThis.backend = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-backend'
    )
      .withNetwork(this.network)
      .withExposedPorts(3000)
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withName('holder-backend')
      .withEnvironment({
        OIDC_AUTH_URL: `http://host.testcontainers.internal:${globalThis.keycloak.getMappedPort(
          8080
        )}`,
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

  static async stop() {
    await (globalThis.backend as StartedGenericContainer).stop();
    await (globalThis.postgresClient as Client).end();
    await (this.postgresContainer as StartedPostgreSqlContainer).stop();
    await this.network.stop();
  }
}
