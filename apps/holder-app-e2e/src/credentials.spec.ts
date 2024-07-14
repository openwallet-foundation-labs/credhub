import { faker } from '@faker-js/faker';
import { test, expect, Page } from '@playwright/test';
import { login, logout, register } from './helpers';
import {
  Keycloak,
  HolderBackend,
  HolderFrontend,
  IssuerBackend,
} from '@credhub/testing';
import axios from 'axios';

export const username = faker.internet.email();
export const password = faker.internet.password();
export let hostname: string;
let keycloak: Keycloak;
let backend: HolderBackend;
let frontend: HolderFrontend;
let issuerBackend: IssuerBackend;
let page: Page;

test.beforeAll(async ({ browser }) => {
  if (process.env['NO_CONTAINER']) {
    hostname = 'http://localhost:4200';
  } else {
    keycloak = await Keycloak.init();
    backend = await HolderBackend.init(keycloak);
    frontend = await HolderFrontend.init(backend);
    issuerBackend = await IssuerBackend.init(keycloak);
    hostname = `http://localhost:${frontend.instance.getMappedPort(80)}`;
  }

  page = await browser.newPage();
  await register(page, hostname, username, password);
  //await logout(page, hostname);
});

test.afterAll(async () => {
  if (process.env['NO_CONTAINER']) {
    return;
  }
  await issuerBackend.stop();
  await keycloak.stop();
  await backend.stop();
  await frontend.stop();
});

function getToken() {
  const keycloakUrl = 'http://localhost:8080';
  const realm = 'wallet';
  const clientId = 'relying-party';
  const clientSecret = 'hA0mbfpKl8wdMrUxr2EjKtL5SGsKFW5D';
  const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  return axios
    .post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((response) => response.data.access_token as string);
}

async function getAxiosInstance() {
  if (process.env['NO_CONTAINER']) {
    const token = await getToken();
    const host = 'localhost';
    const port = 3001;
    return axios.create({
      baseURL: `http://${host}:${port}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    return issuerBackend.getAxiosInstance();
  }
}

test('issuance without pin', async () => {
  // get credential uri and copy it to clipboard
  const axios = await getAxiosInstance();
  const response = await axios.post(`/sessions`, {
    credentialSubject: {},
    credentialId: 'Identity',
    pin: false,
  });
  const uri = response.data.uri;
  console.log(uri);
  await page.evaluate(`navigator.clipboard.writeText("${uri}")`);
  await page.goto(`${hostname}/scan`);
  await page.waitForSelector('#menu');
  await page.click('#menu');
  await page.waitForSelector('#insert');
  await page.click('#insert');
  await page.waitForSelector('#accept');
  await page.click('#accept');
  await page.waitForSelector('#credential');
  expect(true).toBeTruthy();
});
