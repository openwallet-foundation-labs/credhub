/* eslint-disable */
import { HolderBackend, Keycloak } from '../../../../libs/testing/src/index';

module.exports = async function () {
  await (globalThis.backend as HolderBackend).stop();
  await (globalThis.keycloak as Keycloak).stop();
};
