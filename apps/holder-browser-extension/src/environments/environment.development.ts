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
  backendUrl: 'http://localhost:3000',
  keycloakHost: 'http://localhost:8080',
  keycloakClient: 'wallet',
  keycloakRealm: 'wallet',
};

globalThis.environment = environment;
