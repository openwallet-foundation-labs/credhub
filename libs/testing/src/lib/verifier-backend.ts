import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  GenericContainer,
  Network,
  StartedNetwork,
  StartedTestContainer,
  TestContainers,
  Wait,
} from 'testcontainers';
import { Client } from 'pg';
import { Keycloak } from './keycloak';
import axios from 'axios';
import { join } from 'node:path';
import { saveLogs } from './utilts';

/**
 * HolderBackend to manage the holder backend container
 */
export class VerifierBackend {
  // Holder backend network
  network!: StartedNetwork;
  private postgresContainer!: StartedPostgreSqlContainer;
  private postgresClient!: Client;
  instance!: StartedTestContainer;
  oidc: {
    OIDC_AUTH_URL: string;
    OIDC_REALM: string;
    OIDC_CLIENT_ID: string;
    OIDC_CLIENT_SECRET: string;
  };

  static async init(keycloak: Keycloak) {
    const instance = new VerifierBackend(keycloak);
    await instance.start();
    return instance;
  }

  constructor(private keycloak: Keycloak) {
    //TODO: since keycloak is passed, you can use the varibales from keycloak to set it here like realm and client
    this.oidc = {
      OIDC_AUTH_URL: `http://host.testcontainers.internal:${this.keycloak.instance.getMappedPort(
        8080
      )}`,
      OIDC_REALM: 'wallet',
      OIDC_CLIENT_ID: 'relying-party',
      OIDC_CLIENT_SECRET: 'hA0mbfpKl8wdMrUxr2EjKtL5SGsKFW5D',
    };
  }
  /**
   * Start the holder backend container
   * @param network
   */
  async start() {
    const hostPort = Math.floor(Math.random() * 1000) + 7000;
    this.network = await new Network().start();
    this.postgresContainer = await new PostgreSqlContainer()
      .withNetwork(this.network)
      .withName('postgres-verifier')
      .start();
    this.postgresClient = new Client({
      connectionString: this.postgresContainer.getConnectionUri(),
    });
    await this.postgresClient.connect();
    this.instance = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/verifier-backend'
    )
      .withNetwork(this.network)
      .withExposedPorts({ container: 3000, host: hostPort })
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withName('verifier-backend')
      .withLogConsumer((stream) => saveLogs('verifier-backend', stream))
      .withEnvironment({
        ...this.oidc,
        DB_TYPE: 'postgres',
        DB_HOST: 'postgres-verifier',
        DB_PORT: '5432',
        DB_USERNAME: this.postgresContainer.getUsername(),
        DB_PASSWORD: this.postgresContainer.getPassword(),
        DB_NAME: this.postgresContainer.getDatabase(),
        VERIFIER_BASE_URL: `http://host.testcontainers.internal:${hostPort}`,
        CREDENTIALS_FOLDER: 'templates',
        KM_FOLDER: 'data',
      })
      .withBindMounts([
        {
          source: join(
            __dirname,
            '../../../../',
            'deploys/verifier/config/verifier-backend'
          ),
          target: '/home/node/app/templates',
          mode: 'ro',
        },
      ])
      .start();

    await TestContainers.exposeHostPorts(this.instance.getMappedPort(3000));
  }

  /**
   * Get an axios instance with the bearer token
   * @returns
   */
  async getAxiosInstance() {
    const token = await Keycloak.getAccessTokenForClient(
      this.oidc.OIDC_AUTH_URL,
      this.oidc.OIDC_REALM,
      this.oidc.OIDC_CLIENT_ID,
      this.oidc.OIDC_CLIENT_SECRET
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

  async stop() {
    await this.instance.stop();
    await this.postgresClient.end();
    await this.postgresContainer.stop();
    await this.network.stop();
  }
}
