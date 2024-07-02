/* eslint-disable */
import { Readable } from 'node:stream';
import { HolderBackend, Keycloak } from '../../../../libs/testing/src/index';

module.exports = async function () {
  //start keycloak
  const keycloak = await Keycloak.init();
  globalThis.keycloak = keycloak;

  //start backend
  globalThis.backend = await HolderBackend.init();

  (await keycloak.instance.logs())
    .on('data', (line) => console.log(line))
    .on('err', (line) => console.error(line))
    .on('end', () => console.log('Stream closed'));

  const testUserEmail = 'test@test.de';
  const testUserPassword = 'password';
  // create a new user
  await keycloak.createUser(
    `http://localhost:${keycloak.instance.getMappedPort(8080)}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );

  //store the token so it can be used in the tests
  globalThis.userAccessToken = await keycloak.getAccessToken(
    `http://host.testcontainers.internal:${keycloak.instance.getMappedPort(
      8080
    )}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );
};
