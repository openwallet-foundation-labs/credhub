// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let environment: {
    backendUrl: string;
    keycloakHost: string;
    keycloakClient: string;
    keycloakRealm: string;
    demoIssuer: string;
    demoVerifier: string;
  };
}

export const environment = {
  backendUrl: 'http://localhost:3000',
  keycloakHost: 'http://localhost:8080',
  keycloakClient: 'browser',
  keycloakRealm: 'wallet',
  demoIssuer: 'http://localhost:3001',
  demoVerifier: 'http://localhost:3002',
};

globalThis.environment = environment;
