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
import axios from 'axios';
import { saveLogs } from './utilts';

/**
 * HolderBackend to manage the holder backend container
 */
export class HolderBackend {
  // Holder backend network
  network!: StartedNetwork;
  private postgresContainer!: StartedPostgreSqlContainer;
  private postgresClient!: Client;
  instance!: StartedTestContainer;
  oidc: {
    OIDC_AUTH_URL: string;
    OIDC_REALM: string;
    OIDC_PUBLIC_CLIENT_ID: string;
    OIDC_ADMIN_CLIENT_ID: string;
    OIDC_ADMIN_CLIENT_SECRET: string;
  };

  static async init(keycloak: Keycloak) {
    const instance = new HolderBackend(keycloak);
    await instance.start();
    return instance;
  }

  constructor(private keycloak: Keycloak) {
    this.oidc = {
      OIDC_AUTH_URL: `http://host.testcontainers.internal:${this.keycloak.instance.getMappedPort(
        8080
      )}`,
      OIDC_REALM: 'wallet',
      OIDC_PUBLIC_CLIENT_ID: 'wallet',
      OIDC_ADMIN_CLIENT_ID: 'wallet-admin',
      OIDC_ADMIN_CLIENT_SECRET: 'kwpCrguxUOn9gump77E0B3vAkiOhW8eL',
    };
  }

  /**
   * Start the holder backend container
   * @param network
   */
  async start() {
    this.network = await new Network().start();

    this.postgresContainer = await new PostgreSqlContainer()
      .withNetwork(this.network)
      .withName('postgres-backend')
      .start();
    this.postgresClient = new Client({
      connectionString: this.postgresContainer.getConnectionUri(),
    });
    await this.postgresClient.connect();

    this.instance = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-backend'
    )
      .withNetwork(this.network)
      .withExposedPorts(3000)
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withName('holder-backend')
      .withLogConsumer((stream) => saveLogs('holder-backend', stream))
      .withEnvironment({
        ...this.oidc,
        DB_TYPE: 'postgres',
        DB_HOST: 'postgres-backend',
        DB_PORT: '5432',
        DB_USERNAME: this.postgresContainer.getUsername(),
        DB_PASSWORD: this.postgresContainer.getPassword(),
        DB_NAME: this.postgresContainer.getDatabase(),
        WEBAUTHN_RP_ID: 'localhost',
        WEBAUTHN_RP_NAME: 'Holder Backend',
      })
      .start();
  }

  async stop() {
    await this.instance.stop();
    await this.postgresClient.end();
    await this.postgresContainer.stop();
    await this.network.stop();
  }

  /**
   * Get an axios instance with the bearer token
   * @returns
   */
  async getAxiosInstance(username: string, password: string) {
    const token = await this.keycloak.getAccessToken(
      this.oidc.OIDC_AUTH_URL,
      this.oidc.OIDC_REALM,
      username,
      password
    );
    const host = 'localhost';
    const port = this.instance.getMappedPort(3000);
    return axios.create({
      baseURL: `http://${host}:${port}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
