import { HolderBackend, Keycloak } from '@credhub/testing';
import { AxiosInstance } from 'axios';

describe('account settings', () => {
  let axios: AxiosInstance;
  const keycloak = globalThis.keycloak as Keycloak;
  const backend = globalThis.backend as HolderBackend;

  beforeAll(async () => {
    const username = globalThis.testUserEmail;
    const password = globalThis.testUserPassword;
    axios = await backend.getAxiosInstance(username, password);
  });

  it('delete account', async () => {
    const testUserEmail = 'delete@me.de';
    const testUserPassword = 'password';

    //create a new user to not delete the user that is used for the other tests
    await keycloak.createUser(
      `http://localhost:${keycloak.instance.getMappedPort(8080)}`,
      'wallet',
      testUserEmail,
      testUserPassword
    );
    const userAccessToken = await keycloak.getAccessToken(
      `http://host.testcontainers.internal:${keycloak.instance.getMappedPort(
        8080
      )}`,
      'wallet',
      testUserEmail,
      testUserPassword,
      'wallet'
    );
    const settings = await axios.delete('/auth', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    expect(settings.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // call the endpoint again, the token should be invalid since the user is deleted

    // try to get a new token with the deleted user, which should fail
    try {
      await keycloak.getAccessToken(
        `http://host.testcontainers.internal:${keycloak.instance.getMappedPort(
          8080
        )}`,
        'wallet',
        testUserEmail,
        testUserPassword,
        'wallet'
      );
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});
