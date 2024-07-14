import { Page } from '@playwright/test';

export async function register(
  page: Page,
  hostname: string,
  username: string,
  password: string
) {
  await page.goto(hostname);

  //click on the button
  await page.click('#login');

  await page.click('text=Register');

  //fill the form
  await page.fill('input[name=email]', username);
  await page.fill('input[name=password]', password);
  await page.fill('input[name=password-confirm]', password);
  await page.click('input[type=submit]');

  await page.waitForSelector('text=Credentials');
}

export async function login(page: Page, username: string, password: string) {
  //click on the button
  await page.click('#login');

  //login into keycloak
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await page.click('id=kc-login');

  await page.waitForSelector('text=Credentials');
}

export async function logout(page: Page, hostname: string) {
  await page.goto(`${hostname}/settings`);
  await page.click('id=logout');
  await page.waitForSelector('text=Login');
}
