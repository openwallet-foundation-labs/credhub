/* eslint-disable */
import { HolderBackend, Keycloak } from '@credhub/testing';

module.exports = async function () {
  (globalThis.backend as HolderBackend).stop();
  (globalThis.keycloak as Keycloak).stop();
};
