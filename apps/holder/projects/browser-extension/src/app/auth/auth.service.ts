import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { decodeJwt } from 'jose';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  /**
   * Checks if the access token exists and if it is expired
   * @returns
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    const jwt = decodeJwt(token as string);
    if (jwt.exp && new Date(jwt.exp * 1000) < new Date()) return false;
    return true;
  }

  /**
   * Launches the web auth flow to authenticate the user
   */
  async login() {
    console.log(this.getAuthUrl());
    if (typeof chrome.identity !== 'undefined') {
      await chrome.identity
        .launchWebAuthFlow({
          interactive: true,
          url: this.getAuthUrl(),
        })
        .then(
          (redirectUri: string | undefined) => {
            if (!redirectUri) return;
            const accessToken = this.extractTokenFromRedirectUri(redirectUri);
            localStorage.setItem('accessToken', accessToken);
          },
          (err) => console.log(err),
        );
    }
  }

    /**
   * Logs out the user
   */
    async logout() {
      // this.http.post(`${environment.keycloakHost}/realms/${environment.keycloakRealm}/protocol/openid-connect/logout`, null).subscribe(() => {
      //   console.log('successfully logged out');
      //   this.router.navigateByUrl('/login');
      // });

      await chrome.identity
      .launchWebAuthFlow({
        interactive: false,
        url: this.getLogoutUrl(),
      })
      .then(
        () => {
          window.sessionStorage.clear();
          localStorage.clear();
          this.router.navigateByUrl('/login');
        },
        (err) => console.log(err),
      );
    }

  /**
   * Generates the auth url that will be used for login.
   * @returns
   */
  private getAuthUrl() {
    //TODO: it's not just the endpoint that needs to be passed, it's the host, client id and also the backend endpoints. We should provide this via an url that will be loaded and saved locally so it can be used on demand.
    const redirectURL = chrome.identity.getRedirectURL();
    const scopes = ['openid'];
    let authURL = `${environment.keycloakHost}/realms/${environment.keycloakRealm}/protocol/openid-connect/auth`;
    authURL += `?client_id=${environment.keycloakClient}`;
    authURL += '&response_type=token';
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
    return authURL;
  }

  /**
   * Extract the token from the redirectUri, refresh the token 10 seconds before it expires
   * @param redirectUri
   * @returns
   */
  private extractTokenFromRedirectUri(redirectUri: string): string {
    // Assuming redirectUri is the URL you provided
    const fragmentString = redirectUri.split('#')[1];
    const params = new URLSearchParams(fragmentString);
    const accessToken = params.get('access_token') as string;
    //TODO parse the access_token to get the expiration time
    const payload = JSON.parse(window.atob(accessToken.split('.')[1]));
    const refreshTimer =
      new Date(payload.exp * 1000).getTime() -
      new Date(payload.iat * 1000).getTime();

    // Refresh the token 10 seconds before it expires
    setTimeout(() => this.login(), refreshTimer - 1000 * 10);
    // Returning the extracted values
    return accessToken;
  }

  /**
   * Generates the logout URL that will be used for logging out.
   * @returns {string} The logout URL.
   */
  private getLogoutUrl() {
    let logoutUrl = `${environment.keycloakHost}/realms/${environment.keycloakRealm}/protocol/openid-connect/logout`;
    logoutUrl += `?redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}`;
    console.log(logoutUrl);
    return logoutUrl;
  }
}
