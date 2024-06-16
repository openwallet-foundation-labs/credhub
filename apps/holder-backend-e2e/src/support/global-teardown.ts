/* eslint-disable */
import { HolderBackend } from './dependencies/holder-backend';
import { Keycloak } from './dependencies/keycloak';

module.exports = async function () {
  await HolderBackend.stop();
  await Keycloak.stop();
};
