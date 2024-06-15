/* eslint-disable */
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';

module.exports = async function () {
  //kill the backend
  const backend: StartedGenericContainer = globalThis.backend;
  await backend.stop();

  //kill the db
  const db: StartedPostgreSqlContainer = globalThis.postgresContainer;
  const client: Client = globalThis.postgresClient;
  await client.end();
  await db.stop();

  //kill the keycloak
  const keycloak: StartedGenericContainer = globalThis.keycloak;
  await keycloak.stop();

  //kill the keycloak db
  const keycloakDb: StartedPostgreSqlContainer =
    globalThis.postgresKeycloakContainer;
  await keycloakDb.stop();

  //kill the network
  const network = globalThis.network;
  await network.stop();
};
