/* eslint-disable */

import axios from 'axios';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';

module.exports = async function () {
  const host = 'localhost';
  const port = (globalThis.backend as StartedGenericContainer).getMappedPort(
    3000
  );
  axios.defaults.baseURL = `http://${host}:${port}`;
};
