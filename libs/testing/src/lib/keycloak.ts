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
import axios from 'axios';
import { gt } from './holder-backend';

export class Keycloak {
  // Keycloak admin credentials
  ADMIN_USERNAME = 'admin';
  ADMIN_PASSWORD = 'admin';
  // Keycloak network
  network!: StartedNetwork;
  instance!: StartedTestContainer;
  private db!: StartedPostgreSqlContainer;

  static async init() {
    const instance = new Keycloak();
    await instance.start();
    return instance;
  }

  /**
   * Start the keycloak container and its dependencies
   */
  async start() {
    this.network = await new Network().start();
    //create a keycloak database
    this.db = await new PostgreSqlContainer()
      .withNetwork(this.network)
      .withName('postgres-keycloak')
      .start();

    //TODO: define a random port so that multiple instances can run in parallel
    const hostPort = 8080;
    //create a keycloak instance
    this.instance = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/keycloak'
    )
      .withNetwork(this.network)
      .withExposedPorts({ container: 8080, host: hostPort })
      .withWaitStrategy(Wait.forHttp('/health/ready', 8080).forStatusCode(200))
      .withName('keycloak')
      .withEnvironment({
        JAVA_OPTS_APPEND: '-Dkeycloak.profile.feature.upload_scripts=enabled',
        KC_DB_URL: `jdbc:postgresql://postgres-keycloak/${this.db.getDatabase()}?user=${this.db.getUsername()}&password=${this.db.getPassword()}`,
        KC_HEALTH_ENABLED: 'true',
        KC_HTTP_ENABLED: 'true',
        KC_METRICS_ENABLED: 'true',
        KC_HOSTNAME_URL: `http://host.testcontainers.internal:${hostPort}`,
        KEYCLOAK_ADMIN: this.ADMIN_USERNAME,
        KEYCLOAK_ADMIN_PASSWORD: this.ADMIN_PASSWORD,
        KEYCLOAK_IMPORT: '/opt/keycloak/data/import/realm-export.json',
      })
      .withCommand([
        'start',
        '--optimized',
        '--spi-theme-static-max-age=-1',
        '--spi-theme-cache-themes=false',
        '--spi-theme-cache-templates=false',
        '--import-realm',
      ])
      .start();
    await TestContainers.exposeHostPorts(8080);
  }

  /**
   * Gets an access token from Keycloak
   * @param keycloakUrl
   * @param realm
   * @param username
   * @param password
   * @returns
   */
  async getAccessToken(
    keycloakUrl: string,
    realm: string,
    username: string,
    password: string
  ): Promise<string> {
    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    return axios
      .post(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then(
        (response) => response.data.access_token,
        (err) => console.log(err)
      );
  }

  /**
   * Creates a user in Keycloak
   * @param accessToken
   * @param keycloakUrl
   * @param realm
   * @param username
   * @param password
   */
  async createUser(
    keycloakUrl: string,
    realm: string,
    username: string,
    password: string
  ) {
    const accessToken = await this.getAccessToken(
      `http://localhost:${this.instance.getMappedPort(8080)}`,
      'master',
      this.ADMIN_USERNAME,
      this.ADMIN_PASSWORD
    );

    await axios.post(
      `${keycloakUrl}/admin/realms/${realm}/users`,
      {
        username,
        email: username,
        enabled: true,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    //get user id
    const response = await axios.get(
      `${keycloakUrl}/admin/realms/${realm}/users`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const userId = response.data[0].id;

    //set password
    await axios.put(
      `${keycloakUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
      { type: 'password', value: password, temporary: false },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  /**
   * get all users from Keycloak
   */
  async getUsers(keycloakUrl: string, realm: string) {
    const accessToken = await this.getAccessToken(
      `http://localhost:${this.instance.getMappedPort(8080)}`,
      'master',
      this.ADMIN_USERNAME,
      this.ADMIN_PASSWORD
    );
    return axios
      .get(`${keycloakUrl}/admin/realms/${realm}/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => response.data);
  }

  /**
   * Stops the keycloak instance and its dependencies.
   */
  async stop() {
    await this.instance.stop();
    await this.db.stop();
    await this.network.stop();
  }
}

// extend globalThis with the keycloak instance
export interface KeycloakGlobalThis extends gt {
  keycloak: Keycloak;
}
