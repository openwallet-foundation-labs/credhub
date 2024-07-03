// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let environment: {
    backendUrl: string;
    oidcUrl: string;
    keycloakClient: string;
    keycloakRealm: string;
  };
}

export const environment = {
  get backendUrl() {
    return globalThis.environment?.backendUrl;
  },
  get oidcUrl() {
    return globalThis.environment?.oidcUrl;
  },
  get keycloakClient() {
    return globalThis.environment?.keycloakClient;
  },

  sentryDsn:
    'https://6350a5821ef72c29668bd6ca1697b108@o4507537672830976.ingest.de.sentry.io/4507537674993744',
};
