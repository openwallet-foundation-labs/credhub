import { HolderBackend } from './dependencies/holder-backend';
import { Keycloak } from './dependencies/keycloak';

module.exports = async function () {
  //start keycloak
  await Keycloak.start();

  //start backend
  await HolderBackend.start();

  const testUserEmail = 'test@test.de';
  const testUserPassword = 'password';
  // create a new user
  await Keycloak.createUser(
    `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );

  //store the token so it can be used in the tests
  globalThis.userAccessToken = await Keycloak.getAccessToken(
    `http://host.testcontainers.internal:${globalThis.keycloak.getMappedPort(
      8080
    )}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );
  globalThis.foo = 'bar';
};
