import { faker } from '@faker-js/faker';
import { test, expect, Page } from '@playwright/test';
import { getConfig, register } from './helpers';
import axios, { AxiosError } from 'axios';
import { GlobalConfig } from '../global-setup';

export const username = faker.internet.email();
export const password = faker.internet.password();
export let hostname: string;
let page: Page;
let config: GlobalConfig;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  config = getConfig();
  hostname = `http://localhost:${config.holderFrontendPort}`;
  await register(page, hostname, username, password);
});

function getToken() {
  const keycloakUrl = `http://localhost:${config.keycloakPort}`;
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
  const token = await getToken();
  const host = 'localhost';
  return axios.create({
    baseURL: `http://${host}:${port}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function receiveCredential(pin = false) {
  const axios = await getAxiosInstance(config.issuerPort);
  const templates = await axios
    .get('/templates')
    .then((response) => response.data);
  const credentialId = templates.find(
    (template: any) => template.name === 'Identity'
  ).id;

  const response = await axios
    .post(`/sessions`, {
      credentialSubject: {
        prename: 'Max',
        surname: 'Mustermann',
      },
      credentialId,
      pin,
    })
    .catch((e: AxiosError) => {
      console.log(JSON.stringify(e.response?.data, null, 2));
      throw Error('Failed to create session');
    });
  const uri = response.data.uri;
  const userPin = response.data.userPin;
  await page.evaluate(`navigator.clipboard.writeText("${uri}")`);
  await page.goto(`${hostname}/scan`);
  //TODO: when we have the permission, we can direclty paste the uri into the input field. We should also check the case when the user did not give the permission or use the input option.
  /** await page.waitForSelector('#menu').then((menu) => menu.click());
  await page.waitForSelector('#insert').then((button) => button.click());
  **/
  if (userPin) {
    await page
      .waitForSelector('#pin-field')
      .then((element) => element.fill(userPin));
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await page.click('#send');
  }
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(500);
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
  const axios = await getAxiosInstance(config.verifierPort);
  const templates = await axios
    .get('/templates')
    .then((response) => response.data);
  const credentialId = templates.find(
    (template: any) => template.value.name === 'Identity'
  ).id;
  let uri = '';
  try {
    const response = await axios.post(`/siop/${credentialId}`);
    uri = response.data.uri;
  } catch (e) {
    console.log(e);
  }
  await page.evaluate(`navigator.clipboard.writeText("${uri}")`);
  await page.goto(`${hostname}/scan`);
  /**await page.waitForSelector('#menu').then((menu) => menu.click());
  await page.waitForSelector('#insert').then((button) => button.click());**/
  await page.waitForSelector('#match');
  await page.click('mat-list-option');
  await page.click('#send');
  await page.waitForSelector('#success');
  expect(true).toBeTruthy();
});
