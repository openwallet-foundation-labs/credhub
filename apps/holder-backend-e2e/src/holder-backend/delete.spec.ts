import { AxiosInstance } from 'axios';
import { Keycloak } from '../support/dependencies/keycloak';
import { getInstance } from '../support/dependencies/requests';

describe('account settings', () => {
  let axios: AxiosInstance;

  beforeAll(() => {
    axios = getInstance();
  });

  it('delete account', async () => {
    const testUserEmail = 'delete@me.de';
    const testUserPassword = 'password';

    //create a new user to not delete the user that is used for the other tests
    await Keycloak.createUser(
      `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
      'wallet',
      testUserEmail,
      testUserPassword
    );
    const userAccessToken = await Keycloak.getAccessToken(
      `http://host.testcontainers.internal:${globalThis.keycloak.getMappedPort(
        8080
      )}`,
      'wallet',
      testUserEmail,
      testUserPassword
    );
    const settings = await axios.delete('/auth', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    expect(settings.status).toBe(200);

    // call the endpoint again, the token should be invalid since the user is deleted
    const res = axios.delete('/auth', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    expect(res).rejects.toThrow();

    // try to get a new token with the deleted user, which should fail
    const response = Keycloak.getAccessToken(
      `http://host.testcontainers.internal:${globalThis.keycloak.getMappedPort(
        8080
      )}`,
      'wallet',
      testUserEmail,
      testUserPassword
    );
    expect(response).rejects.toThrow();
  });
});
