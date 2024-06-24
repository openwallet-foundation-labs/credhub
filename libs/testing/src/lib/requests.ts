import axios, { AxiosInstance } from 'axios';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';

/**
 * Get the axios instance with the endpoint and a valid token
 * @returns
 */
export function getInstance(): AxiosInstance {
  const host = 'localhost';
  const port = (globalThis.backend as StartedGenericContainer).getMappedPort(
    3000
  );
  return axios.create({
    baseURL: `http://${host}:${port}`,
    headers: { Authorization: `Bearer ${globalThis.userAccessToken}` },
  });
}
