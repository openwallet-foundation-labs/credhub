import { Injectable } from '@angular/core';
import { decodeJwt } from 'jose';
import { BehaviorSubject } from 'rxjs';
import { AuthServiceInterface, ConfigService } from '@credhub/holder-shared';

interface Storage {
  access_token: string;
  expiration_time: number;
  id_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthServiceInterface {
  changed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private token?: string;

  constructor(private configService: ConfigService) {}

  getToken() {
    return this.token as string;
  }

  /**
   * Returns the settings link to manage authentication.
   * @returns
   */
  getSettingsLink(): string {
    return `${this.configService.getConfig('oidcUrl')}/account`;
  }

  /**
   * Checks if the access token exists and if it is expired
   * @returns
   */
  isAuthenticated(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['access_token'], (values) => {
        const token = (values as Storage).access_token;
        if (!token) return reject(false);
        const jwt = decodeJwt(token as string);
        if (jwt.exp && new Date(jwt.exp * 1000) < new Date())
          return reject(false);
        this.changed.next(true);
        resolve(true);
      });
    });
  }

  /**
   * Gets the access token from the storage
   * @returns
   */
  setToken(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get('access_token', (values) => {
        const token = (values as Storage).access_token;
        this.token = token;
        resolve();
      });
    });
  }

  /**
   * Launches the web auth flow to authenticate the user
   */
  async login() {
    if (typeof chrome.identity !== 'undefined') {
      console.log(this.getAuthUrl());
      await chrome.identity
        .launchWebAuthFlow({
          interactive: true,
          url: this.getAuthUrl(),
        })
        .then(
          (redirectUri: string | undefined) => {
            if (!redirectUri) return;
            const { accessToken, expiresIn, idToken } =
              this.parseUrl(redirectUri);
            return chrome.storage.local.set({
              access_token: accessToken,
              id_token: idToken,
              expiration_time:
                new Date().getTime() / 1000 + Number.parseInt(expiresIn),
            });
          },
          (err) => console.log(err)
        );
    }
  }

  /**
   * Generates a random string
   * @returns
   */
  private generateRandomString() {
    const array = new Uint32Array(28);
    crypto.getRandomValues(array);
    return Array.from(array, (dec) => `0${dec.toString(16)}`.substr(-2)).join(
      ''
    );
  }

  /**
   * Generates the auth url that will be used for login.
   * @returns
   */
  private getAuthUrl() {
    const redirectURL = chrome.identity.getRedirectURL();
    const scopes = ['openid'];
    const nonce = this.generateRandomString();

    const url = new URL(
      `${this.configService.getConfig('oidcUrl')}/protocol/openid-connect/auth`
    );
    const params = {
      client_id: this.configService.getConfig<string>('oidcClient'),
      response_type: 'id_token token',
      redirect_uri: redirectURL,
      nonce: nonce,
      scope: scopes.join(' '),
    };
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  /**
   * Extract the token from the redirectUri, refresh the token 10 seconds before it expires
   * @param redirectUri
   * @returns
   */
  private parseUrl(redirectUri: string) {
    // Assuming redirectUri is the URL you provided
    const fragmentString = redirectUri.split('#')[1];
    const params = new URLSearchParams(fragmentString);
    const accessToken = params.get('access_token') as string;
    const idToken = params.get('id_token') as string;
    const expiresIn = params.get('expires_in') as string;
    if (!idToken || !accessToken || !expiresIn) {
      throw new Error('Missing required parameters in redirect URL.');
    }
    //TODO parse the access_token to get the expiration time
    const payload = JSON.parse(window.atob(accessToken.split('.')[1]));
    const refreshTimer =
      new Date(payload.exp * 1000).getTime() -
      new Date(payload.iat * 1000).getTime();

    // Refresh the token 10 seconds before it expires
    setTimeout(() => this.login(), refreshTimer - 1000 * 10);
    // Returning the extracted values
    return { idToken, accessToken, expiresIn };
  }

  /**
   * Logs out the user. It will close the window after the user is logged out.
   */
  async logout() {
    await chrome.identity
      .launchWebAuthFlow({
        interactive: false,
        url: await this.getLogoutUrl(),
      })
      .then(
        () =>
          chrome.storage.local.remove(
            ['access_token', 'expiration_time', 'id_token'],
            () => window.close()
          ),
        (err) => console.log(err)
      );
  }

  /**
   * Generates the logout URL that will be used for logging out.
   * @returns {string} The logout URL.
   */
  private getLogoutUrl(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['id_token'], (values) => {
        const idToken = (values as Storage).id_token;
        const logoutUrl =
          `${this.configService.getConfig(
            'oidcClient'
          )}/protocol/openid-connect/logout` +
          `?client_id=${this.configService.getConfig('oidcClient')}` +
          `&id_token_hint=${idToken}` +
          `&post_logout_redirect_uri=${encodeURIComponent(
            chrome.identity.getRedirectURL('')
          )}`;
        resolve(logoutUrl);
      });
    });
  }
}
