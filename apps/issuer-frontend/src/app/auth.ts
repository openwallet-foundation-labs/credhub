import { config } from './config';

let accessToken: string;
let accessTokenExpires: Date;

// Function to authenticate and obtain access token
export async function authenticateWithKeycloak() {
  // in case the access token is still valid, return it
  if (accessToken && accessTokenExpires > new Date()) {
    return accessToken;
  }
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${config.clientId}&client_secret=${config.clientSecret}`,
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Keycloak');
  }

  const data = await response.json();
  accessToken = data.access_token;
  accessTokenExpires = new Date(Date.now() + data.expires_in * 1000);
  return accessToken;
}
