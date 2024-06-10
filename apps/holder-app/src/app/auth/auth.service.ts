/* eslint-disable brace-style */

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthServiceInterface } from '@my-wallet/holder-shared';
import { ConfigService } from '../config.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements AuthServiceInterface {
  private isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();

  private isDoneLoadingSubject$ = new BehaviorSubject<boolean>(false);
  public isDoneLoading$ = this.isDoneLoadingSubject$.asObservable();

  /**
   * Publishes `true` if and only if (a) all the asynchronous initial
   * login calls have completed or errorred, and (b) the user ended up
   * being authenticated.
   *
   * In essence, it combines:
   *
   * - the latest known state of whether the user is authorized
   * - whether the ajax calls for initial log in have all been done
   */
  public canActivateProtectedRoutes$: Observable<boolean> = combineLatest([
    this.isAuthenticated$,
    this.isDoneLoading$,
  ]).pipe(map((values) => values.every((b) => b)));

  private navigateToLoginPage() {
    // TODO: Remember current URL
    this.router.navigateByUrl('/login');
  }

  constructor(
    private oauthService: OAuthService,
    private router: Router,
    private configService: ConfigService
  ) {
    // this.init();
  }

  getSettingsLink(): string {
    return `${this.configService.getConfig('oidcUrl')}/account`;
  }

  /**
   * Returns the configuration for the OAuthService.
   * @returns
   */
  private getConfig(): AuthConfig {
    return {
      issuer: this.configService.getConfig<string>('oidcUrl'),
      clientId: this.configService.getConfig<string>('oidcClient'), // The "Auth Code + PKCE" client
      responseType: 'code',
      redirectUri: `${window.location.origin}/`,
      silentRefreshRedirectUri: `${window.location.origin}/silent-refresh.html`,
      scope: 'openid', // Ask offline_access to support refresh token refreshes
      useSilentRefresh: false, // Needed for Code Flow to suggest using iframe-based refreshes
      silentRefreshTimeout: 5000, // For faster testing
      timeoutFactor: 0.25, // For faster testing
      sessionChecksEnabled: true,
      showDebugInformation: false, // Also requires enabling "Verbose" level in devtools
      clearHashAfterLogin: false, // https://github.com/manfredsteyer/angular-oauth2-oidc/issues/457#issuecomment-431807040,
      nonceStateSeparator: 'semicolon', // Real semicolon gets mangled by Duende ID Server's URI encoding
      logoutUrl: `${this.configService.getConfig<string>(
        'oidcUrl'
      )}/protocol/openid-connect/logout`,
      requireHttps: false,
    };
  }

  public init() {
    // Useful for debugging:
    // this.oauthService.events.subscribe((event) => {
    //   if (event instanceof OAuthErrorEvent) {
    //     console.error('OAuthErrorEvent Object:', event);
    //   } else {
    //     console.warn('OAuthEvent Object:', event);
    //   }
    // });

    //TODO: allow the user to add a custom login url during the login process.
    this.oauthService.configure(this.getConfig());

    // THe following cross-tab communication of fresh access tokens works usually in practice,
    // but if you need more robust handling the community has come up with ways to extend logic
    // in the library which may give you better mileage.
    //
    // See: https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards/issues/2
    //
    // Until then we'll stick to this:
    window.addEventListener('storage', (event) => {
      // The `key` is `null` if the event was caused by `.clear()`
      if (event.key !== 'access_token' && event.key !== null) {
        return;
      }

      this.isAuthenticatedSubject$.next(
        this.oauthService.hasValidAccessToken()
      );

      if (!this.oauthService.hasValidAccessToken()) {
        this.navigateToLoginPage();
      }
    });

    this.oauthService.events.subscribe(() => {
      this.isAuthenticatedSubject$.next(
        this.oauthService.hasValidAccessToken()
      );
    });
    this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());

    this.oauthService.events
      .pipe(filter((e) => ['token_received'].includes(e.type)))
      .subscribe(() => this.oauthService.loadUserProfile());

    this.oauthService.events
      .pipe(
        filter((e) => ['session_terminated', 'session_error'].includes(e.type))
      )
      .subscribe(() => this.navigateToLoginPage());

    this.oauthService.setupAutomaticSilentRefresh();
  }

  public runInitialLoginSequence(): Promise<void> {
    this.init();
    // 0. LOAD CONFIG:
    // First we have to check to see how the IdServer is
    // currently configured:
    return (
      this.oauthService
        .loadDiscoveryDocument()

        // 1. HASH LOGIN:
        // Try to log in via hash fragment after redirect back
        // from IdServer from initImplicitFlow:
        .then(() => this.oauthService.tryLogin())

        .then(() => {
          if (this.oauthService.hasValidAccessToken()) {
            return Promise.resolve();
          }

          // 2. SILENT LOGIN:
          // Try to log in via a refresh because then we can prevent
          // needing to redirect the user:
          return this.oauthService
            .silentRefresh()
            .then(() => Promise.resolve())
            .catch((result) => {
              // Subset of situations from https://openid.net/specs/openid-connect-core-1_0.html#AuthError
              // Only the ones where it's reasonably sure that sending the
              // user to the IdServer will help.
              const errorResponsesRequiringUserInteraction = [
                'interaction_required',
                'login_required',
                'account_selection_required',
                'consent_required',
              ];

              if (
                result &&
                result.reason &&
                errorResponsesRequiringUserInteraction.indexOf(
                  result.reason.params.error
                ) >= 0
              ) {
                // 3. ASK FOR LOGIN:
                // At this point we know for sure that we have to ask the
                // user to log in, so we redirect them to the IdServer to
                // enter credentials.
                //
                // Enable this to ALWAYS force a user to login.
                // this.login();
                //
                // Instead, we'll now do this:
                return Promise.resolve();
              }

              // We can't handle the truth, just pass on the problem to the
              // next handler.
              return Promise.reject(result);
            });
        })

        .then(() => {
          this.isDoneLoadingSubject$.next(true);
          if (
            this.oauthService.state &&
            this.oauthService.state !== 'undefined' &&
            this.oauthService.state !== 'null'
          ) {
            let stateUrl = this.oauthService.state;
            if (stateUrl.startsWith('/') === false) {
              stateUrl = decodeURIComponent(stateUrl);
            }
            this.router.navigateByUrl(stateUrl);
          }
        })
        .catch(() => this.isDoneLoadingSubject$.next(true))
    );
  }

  public login(targetUrl?: string) {
    //TODO: check if config has to be loaded here or in the constructor.
    // Note: before version 9.1.0 of the library you needed to
    // call encodeURIComponent on the argument to the method.
    this.oauthService.initLoginFlow(targetUrl || this.router.url);
  }

  public async logout() {
    this.oauthService.logOut();
  }
  public refresh() {
    this.oauthService.silentRefresh();
  }
  public hasValidToken() {
    return this.oauthService.hasValidAccessToken();
  }

  // These normally won't be exposed from a service like this, but
  // for debugging it makes sense.
  public get accessToken() {
    return this.oauthService.getAccessToken();
  }
  public get refreshToken() {
    return this.oauthService.getRefreshToken();
  }
  public get identityClaims() {
    return this.oauthService.getIdentityClaims();
  }
  public get idToken() {
    return this.oauthService.getIdToken();
  }
  public get logoutUrl() {
    return this.oauthService.logoutUrl;
  }
}
