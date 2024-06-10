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
  backendUrl: 'http://localhost:3000',
  oidcUrl: 'http://host.docker.internal:8080',
  keycloakClient: 'wallet',
  keycloakRealm: 'wallet',
};

globalThis.environment = environment;
