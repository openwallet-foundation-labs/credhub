import { Network } from 'testcontainers';
import { Keycloak } from './keycloak';
import { HolderBackend } from './holder-backend';

module.exports = async function () {
  //create a newtwork
  globalThis.network = await new Network().start();

  //start keycloak
  await Keycloak.start(globalThis.network);

  //create a user in keycloak
  const accessToken = await Keycloak.getAccessToken(
    `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
    'master',
    'admin',
    'admin'
  );
  await Keycloak.createUser(
    accessToken,
    `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
    'wallet',
    'test@test.de',
    'password'
  );

  const userAccessToken = await Keycloak.getAccessToken(
    `http://localhost:${globalThis.keycloak.getMappedPort(8080)}`,
    'wallet',
    'test@test.de',
    'password'
  );

  //start backend
  await HolderBackend.start(globalThis.network);
};
