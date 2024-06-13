To install all dependencies, run `pnpm install` in the root folder.

Each app has its own `package.json` with specific jobs. In the root folder is one `package.json` with global jobs like `build`, `clean` and `lint`.

The command `pnpm run -r init` will generate `.env` files for each app based on the example file. Applications inside the `apps` folder will not use the `.env` file in the root folder, this is only for the docker-compose setup. Instead use the `.env` files in the apps folder. In case it's an angular application, use the config file in the `assets/config` folder.
