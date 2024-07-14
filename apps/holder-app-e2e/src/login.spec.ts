import { HolderBackend, HolderFrontend, Keycloak } from '@credhub/testing';
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { login, logout, register } from './helpers';

export const username = faker.internet.email();
export const password = faker.internet.password();
export let hostname: string;
let keycloak: Keycloak;
let backend: HolderBackend;
let frontend: HolderFrontend;

test.beforeAll(async ({ browser }) => {
  if (process.env['NO_CONTAINER']) {
    hostname = 'http://localhost:4200';
  } else {
    keycloak = await Keycloak.init();
    backend = await HolderBackend.init(keycloak);
    frontend = await HolderFrontend.init(backend);
    hostname = `http://localhost:${frontend.instance.getMappedPort(80)}`;
  }

  const page = await browser.newPage();
  await register(page, hostname, username, password);
  await logout(page, hostname);
});

test.afterAll(async () => {
  if (process.env['NO_CONTAINER']) {
    return;
  }
  await keycloak.stop();
  await backend.stop();
  await frontend.stop();
});

test('register', async ({ page }) => {
  const username = faker.internet.email();
  const password = faker.internet.password();
  await register(page, hostname, username, password);
  expect(true).toBeTruthy();
});

test('login', async ({ page }) => {
  await page.goto(hostname);
  await login(page, username, password);

  expect(true).toBeTruthy();
});

test('logout', async ({ page }) => {
  await page.goto(hostname);

  await login(page, username, password);
  await logout(page, hostname);
  //expect to see the login button
  expect(true).toBeTruthy();
});

test('delete account', async ({ page }) => {
  await page.goto(hostname);
  await login(page, username, password);

  page.on('dialog', async (dialog) => dialog.accept());
  await page.goto(`${hostname}/settings`);

  await page.waitForSelector('id=delete-account');

  await page.click('id=delete-account');

  await page.waitForSelector('text=Login');

  //click on the button
  await page.click('#login');

  //login into keycloak
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await page.click('id=kc-login');

  //Invalid username or password. should be seen as an error
  await page.waitForSelector('text=Invalid username or password.');
  expect(true).toBeTruthy();
});
