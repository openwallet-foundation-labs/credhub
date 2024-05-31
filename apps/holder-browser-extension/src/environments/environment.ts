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
  backendUrl: 'https://backend.credhub.eu',
  keycloakHost: 'http://auth.credhub.eu',
  keycloakClient: 'wallet',
  keycloakRealm: 'wallet',
};

globalThis.environment = environment;
