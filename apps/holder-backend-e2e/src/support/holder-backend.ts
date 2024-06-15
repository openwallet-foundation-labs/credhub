import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedNetwork, Wait } from 'testcontainers';
import { Client } from 'pg';

export class HolderBackend {
  static async start(network: StartedNetwork) {
    globalThis.postgresContainer = await new PostgreSqlContainer()
      .withNetwork(network)
      .withName('postgres')
      .start();
    globalThis.postgresClient = new Client({
      connectionString: globalThis.postgresContainer.getConnectionUri(),
    });
    await globalThis.postgresClient.connect();

    globalThis.backend = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-backend'
    )
      .withNetwork(network)
      .withExposedPorts(3000)
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withName('holder-backend')
      .withEnvironment({
        OIDC_AUTH_URL: 'http://host.docker.internal:8080',
        OIDC_REALM: 'wallet',
        OIDC_PUBLIC_CLIENT_ID: 'wallet',
        OIDC_ADMIN_CLIENT_ID: 'wallet-admin',
        OIDC_ADMIN_CLIENT_SECRET: 'kwpCrguxUOn9gump77E0B3vAkiOhW8eL',
        DB_TYPE: 'postgres',
        DB_HOST: 'postgres',
        DB_PORT: '5432',
        DB_USERNAME: globalThis.postgresContainer.getUsername(),
        DB_PASSWORD: globalThis.postgresContainer.getPassword(),
        DB_NAME: globalThis.postgresContainer.getDatabase(),
      })
      .start();
  }
}
