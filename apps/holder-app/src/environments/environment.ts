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
};
