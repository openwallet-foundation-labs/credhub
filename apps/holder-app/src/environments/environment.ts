// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let environment: {
    backendUrl: string;
    keycloakHost: string;
    keycloakClient: string;
    keycloakRealm: string;
  };
}

export const environment = {
  get backendUrl() {
    return globalThis.environment?.backendUrl;
  },
  get keycloakHost() {
    return globalThis.environment?.keycloakHost;
  },
  get keycloakClient() {
    return globalThis.environment?.keycloakClient;
  },
  get keycloakRealm() {
    return globalThis.environment?.keycloakRealm;
  },
};
