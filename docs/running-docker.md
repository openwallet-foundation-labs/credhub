# Running Docker images
To run the docker compose setup, copy the `.env.example` to `.env` in the root folder. Modify the values if required.

## Building containers
Running `docker compose build` will build the images locally. This is required if you want to run your modified apps. The typescript code gets compiled during the image build process, so there is no need to run `pnpm install` or any other build command before this.

## Configs
The configuration of the pwa client is mounted from the `config/holder/config.js` file, this allows to change the endpoints to the different services without the need to recompile the app.

## Known limitations
right now running it locally via docker can cause some problems since `localhost` is used to interact with some services.
