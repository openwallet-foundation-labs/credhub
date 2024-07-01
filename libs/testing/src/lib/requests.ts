import axios, { AxiosInstance } from 'axios';
import { BackendGlobalThis, gt } from './holder-backend';

interface TokenGlobalThis extends gt {
  userAccessToken: string;
}

/**
 * Get the axios instance with the endpoint and a valid token
 * @returns
 */
export function getInstance(): AxiosInstance {
  const host = 'localhost';
  const port = (globalThis as BackendGlobalThis).backend.instance.getMappedPort(
    3000
  );
  return axios.create({
    baseURL: `http://${host}:${port}`,
    headers: {
      Authorization: `Bearer ${
        (globalThis as TokenGlobalThis).userAccessToken
      }`,
    },
  });
}
