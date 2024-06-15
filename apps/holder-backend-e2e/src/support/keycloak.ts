import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedNetwork, Wait } from 'testcontainers';
import axios from 'axios';

export class Keycloak {
  static async start(network: StartedNetwork) {
    //create a keycloak database
    globalThis.postgresKeycloakContainer = await new PostgreSqlContainer()
      .withNetwork(network)
      .withName('postgres-keycloak')
      .start();

    //create a keycloak instance
    globalThis.keycloak = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/keycloak'
    )
      .withNetwork(network)
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forHttp('/health', 8080).forStatusCode(200))
      .withName('keycloak')
      .withEnvironment({
        JAVA_OPTS_APPEND: '-Dkeycloak.profile.feature.upload_scripts=enabled',
        KC_DB_URL: `jdbc:postgresql://postgres-keycloak/${globalThis.postgresKeycloakContainer.getDatabase()}?user=${globalThis.postgresKeycloakContainer.getUsername()}&password=${globalThis.postgresKeycloakContainer.getPassword()}`,
        KC_HEALTH_ENABLED: 'true',
        KC_HTTP_ENABLED: 'true',
        KC_METRICS_ENABLED: 'true',
        KC_HOSTNAME_URL: 'http://host.testcontainers.internal:8080',
        KEYCLOAK_ADMIN: 'admin',
        KEYCLOAK_ADMIN_PASSWORD: 'admin',
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
  }

  /**
   * Gets an access token from Keycloak
   * @param keycloakUrl
   * @param realm
   * @param username
   * @param password
   * @returns
   */
  static async getAccessToken(
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

  static async createUser(
    accessToken: string,
    keycloakUrl: string,
    realm: string,
    username: string,
    password: string
  ) {
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
    await axios
      .put(
        `${keycloakUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
        { type: 'password', value: password, temporary: false },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .catch((err) => console.log(err));
  }
}
