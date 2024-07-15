/* eslint-disable */
import { HolderBackend, Keycloak } from '../../../../libs/testing/src/index';

module.exports = async function () {
  //start keycloak
  const keycloak = await Keycloak.init();
  globalThis.keycloak = keycloak;

  //start backend
  globalThis.backend = await HolderBackend.init(keycloak);

  const testUserEmail = 'test@test.de';
  const testUserPassword = 'password';
  // create a new user
  await keycloak.createUser(
    `http://localhost:${keycloak.instance.getMappedPort(8080)}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );
  globalThis.testUserEmail = testUserEmail;
  globalThis.testUserPassword = testUserPassword;
};
