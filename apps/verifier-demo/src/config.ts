export let config: Config;

//fetch the config
fetch('/config.json')
  .then((res) => res.json())
  .then((res) => {
    config = res;
  });
export interface Config {
  verifierUrl: string;
  credentialId: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
}
