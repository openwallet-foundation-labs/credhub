/* eslint-disable */
import { HolderBackend, Keycloak } from '../../../../libs/testing/src/index';

module.exports = async function () {
  (globalThis.backend as HolderBackend).stop();
  (globalThis.keycloak as Keycloak).stop();
};
