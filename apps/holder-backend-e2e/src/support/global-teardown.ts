/* eslint-disable */
import { HolderBackend, Keycloak } from '@credhub/testing';

module.exports = async function () {
  await HolderBackend.stop();
  await Keycloak.stop();
};
