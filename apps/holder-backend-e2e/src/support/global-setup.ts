import { HolderBackend, Keycloak } from '@credhub/testing';

module.exports = async function () {
  //start keycloak
  const keycloak = await Keycloak.init();
  globalThis.keycloak = keycloak;

  //start backend
  globalThis.backend = await HolderBackend.init();

  const testUserEmail = 'test@test.de';
  const testUserPassword = 'password';
  // create a new user
  await keycloak.createUser(
    `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );

  //store the token so it can be used in the tests
  globalThis.userAccessToken = await keycloak.getAccessToken(
    `http://host.testcontainers.internal:${globalThis.keycloak.getMappedPort(
      8080
    )}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );
};
