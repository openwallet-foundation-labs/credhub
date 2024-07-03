import {
  Keycloak,
  HolderBackend,
  KeycloakGlobalThis,
  BackendGlobalThis,
  HolderFrontend,
} from '@credhub/testing';
import { test, expect } from '@playwright/test';

const username = 'mirko@gmx.de';
const password = 'mirko';
let keycloak: Keycloak;
let backend: HolderBackend;
let frontend: HolderFrontend;
let hostname: string;

test.beforeAll(async () => {
  //start keycloak
  keycloak = await Keycloak.init();
  (globalThis as KeycloakGlobalThis).keycloak = keycloak;

  //start backend
  backend = await HolderBackend.init();
  (globalThis as BackendGlobalThis).backend = backend;

  //start frontend
  frontend = await HolderFrontend.init();

  hostname = `http://localhost:${frontend.instance.getMappedPort(80)}`;

  const testUserEmail = 'test@test.de';
  const testUserPassword = 'password';
  // create a new user
  await keycloak.createUser(
    `http://localhost:${keycloak.instance.getMappedPort(8080)}`,
    'wallet',
    testUserEmail,
    testUserPassword
  );
});

test.afterAll(async () => {
  await frontend.stop();
  await backend.stop();
  await keycloak.stop();
});

test('register', async ({ page }) => {
  await page.goto(hostname);

  //click on the button
  await page.click('text=Login');

  await page.click('text=Register');

  //fill the form
  await page.fill('input[name=email]', username);
  await page.fill('input[name=password]', password);
  await page.fill('input[name=password-confirm]', password);
  await page.click('input[type=submit]');

  await page.waitForSelector('text=Credentials');
  expect(true).toBeTruthy();
});

test('login', async ({ page }) => {
  await page.goto(hostname);

  //click on the button
  await page.click('text=Login');

  //login into keycloak
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await page.click('id=kc-login');

  //wait for the password input field
  // await page.waitForSelector('input[name=password]');
  // await page.click('text=Sign In');

  await page.waitForSelector('text=Credentials');

  expect(true).toBeTruthy();
});

test('logout', async ({ page }) => {
  await page.goto(hostname);

  //click on the button
  await page.click('text=Login');

  //login into keycloak
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await page.click('id=kc-login');

  await page.waitForSelector('text=Credentials');
  await page.goto(`${hostname}/settings`);

  await page.click('id=logout');

  await page.waitForSelector('text=Login');
  //expect to see the login button
  expect(true).toBeTruthy();
});

//TODO: does not work yet
// test('delete account', async ({ page }) => {
//   await page.goto('http://localhost:4200');

//   page.on('dialog', async (dialog) => dialog.accept());

//   //click on the button
//   await page.click('text=Login');

//   //login into keycloak
//   await page.fill('input[name=username]', username);
//   await page.fill('input[name=password]', password);
//   await page.click('id=kc-login');

//   await page.waitForSelector('text=Credentials');
//   await page.goto('http://localhost:4200/settings');

//   await page.waitForSelector('id=delete-account');

//   await page.click('id=delete-account');

//   await page.waitForSelector('text=Login');

//   //click on the button
//   await page.click('text=Login');

//   //login into keycloak
//   await page.fill('input[name=username]', username);
//   await page.fill('input[name=password]', password);
//   await page.click('id=kc-login');

//   //Invalid username or password. should be seen as an error
//   await page.waitForSelector('text=Invalid username or password.');
//   expect(true).toBeTruthy();
// });
