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
  backendUrl: 'https://backend.credhub.eu',
  oidcUrl: 'http://auth.credhub.eu',
  keycloakClient: 'wallet',
  keycloakRealm: 'wallet',
};

globalThis.environment = environment;
