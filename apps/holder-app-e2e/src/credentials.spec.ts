import { faker } from '@faker-js/faker';
import { test, expect, Page } from '@playwright/test';
import { register } from './helpers';
import {
  Keycloak,
  HolderBackend,
  HolderFrontend,
  IssuerBackend,
  VerifierBackend,
} from '@credhub/testing';
import axios from 'axios';

export const username = faker.internet.email();
export const password = faker.internet.password();
export let hostname: string;
let keycloak: Keycloak;
let backend: HolderBackend;
let frontend: HolderFrontend;
let issuerBackend: IssuerBackend;
let verifierBackend: VerifierBackend;
let page: Page;

test.beforeAll(async ({ browser }) => {
  if (process.env['NO_CONTAINER']) {
    hostname = 'http://localhost:4200';
  } else {
    keycloak = await Keycloak.init();
    backend = await HolderBackend.init(keycloak);
    frontend = await HolderFrontend.init(backend);
    issuerBackend = await IssuerBackend.init(keycloak);
    verifierBackend = await VerifierBackend.init(keycloak);
    hostname = `http://localhost:${frontend.instance.getMappedPort(80)}`;
  }

  page = await browser.newPage();
  await register(page, hostname, username, password);
});

test.afterAll(async () => {
  if (process.env['NO_CONTAINER']) {
    return;
  }
  await verifierBackend.stop();
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

async function getAxiosInstance(port: number) {
  if (process.env['NO_CONTAINER']) {
    const token = await getToken();
    const host = 'localhost';
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

async function receiveCredential(pin = false) {
  const axios = await getAxiosInstance(3001);
  const response = await axios.post(`/sessions`, {
    credentialSubject: {
      prename: 'Max',
      surname: 'Mustermann',
    },
    credentialId: 'Identity',
    pin,
  });
  const uri = response.data.uri;
  const userPin = response.data.userPin;
  await page.evaluate(`navigator.clipboard.writeText("${uri}")`);
  await page.goto(`${hostname}/scan`);
  const menu = await page.waitForSelector('#menu');
  await menu.click();
  const inserButton = await page.waitForSelector('#insert');
  await inserButton.click();
  if (userPin) {
    const el = await page.waitForSelector('#pin-field');
    await el.fill(userPin);
    await page.click('#send');
  }
  const acceptButton = await page.waitForSelector('#accept');
  await acceptButton.click();
  await page.waitForSelector('#credential');
}

test('issuance without pin', async () => {
  // get credential uri and copy it to clipboard
  await receiveCredential();
  expect(true).toBeTruthy();
});

test('issuance with pin', async () => {
  // get credential uri and copy it to clipboard
  await receiveCredential(true);
  expect(true).toBeTruthy();
});

test('verify credential', async () => {
  await receiveCredential();
  const credentialId = 'Identity';
  const axios = await getAxiosInstance(3002);
  const response = await axios.post(`/siop/${credentialId}`);
  const uri = response.data.uri;
  await page.evaluate(`navigator.clipboard.writeText("${uri}")`);
  await page.goto(`${hostname}/scan`);
  await page.waitForSelector('#menu').then((menu) => menu.click());
  await page.waitForSelector('#insert').then((button) => button.click());
  await page.waitForSelector('#match');
  await page.click('mat-list-option');
  await page.click('#send');
  await page.waitForSelector('#success');
  expect(true).toBeTruthy();
});
