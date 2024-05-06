# Running Docker images
To run the docker compose setup, copy the `.env.example` to `.env` in the root folder. Modify the values if required.

## Building containers
Running `docker compose build` will build the images locally. This is required if you want to run your modified apps. The typescript code gets compiled during the image build process, so there is no need to run `pnpm install` or any other build command before this.

## Configs
The configuration of the pwa client is mounted from the `config/holder/config.js` file, this allows to change the endpoints to the different services without the need to recompile the app.

## Known limitations
right now running it locally via docker can cause some problems since `localhost` is used to interact with some services.

## Vault
To secure your keys, you are able to use [vault by hashicorp](https://developer.hashicorp.com/vault), otherwise the keys are either stored in the filesystem for the issuer and verifier or in the unencrypted database for the wallet.

You are able to run vault via docker with the following command:
```bash
docker compose up -d vault
```
This will spin up a vault instance in dev mode and will not persist the keys after a restart. In the `.env` in the root folder, you can set a token you need for authentication.

### Using in the cloud wallet

Configure the environment variables in the `.env` to tell the service to use vault:
```env
KM_TYPE=vault
VAULT_URL=http://localhost:8200/v1/transit
VAULT_TOKEN=root
```
The server does not support multiple key management systems in parallel and also no import or export feature. So decide at the beginning which type of key management you want to use.

TODO: we also need key management for the accounts to support multiple keys, because right now we use the user-id for the key reference, so each user is only able to store one key. We need a mapping table for the keys and the user-id.

### Using in the issuer and verifier

TODO: not implemented yet.

### Production use
Update the docker container like this:
```yaml
  vault:
    image: 'hashicorp/vault:1.16'
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'vault', 'status']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 2m
    volumes:
      - vault-storage:/vault/file:rw
      - ./config/vault:/vault/config:rw
    ports:
      - '8200:8200'
    environment:
      VAULT_ADDR: http://127.0.0.1:8200
    entrypoint: vault server -config=/vault/config/config.hcl
```
Get familiar with the [vault deployment guide](https://developer.hashicorp.com/vault/tutorials/getting-started/getting-started-deploy). This current documentation is not fully covered to run vault in production!