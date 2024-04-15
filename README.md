# Modular Wallet

Instead of building a framework for wallets in one programming language, this repo will provide multiple web services that can be used to handle the different tasks of a wallet.


# Setup
To install all dependencies for all apps, run `pnpm install` in the root folder.

Copy the `.env.example` file to `.env` and modify the values to your needs.
Dependencies like keycloak and the persistent storage of the backend can be started with `docker compose up -d`.

# Apps

# Issuer
The issuer app is a rest api, supporting the oid4vci protocol. Right now there is only one demo credential available. Start the issuer with `pnpm run dev`.

# Verifier
The verifier app is a rest api, supporting the oid4vcp protocol. The verifier can verify the demo credential from the issuer. Start the verifier with `pnpm run dev`.

# Browser Plugin
The command `pnpm run start:dev` in the `browser-wallet` folder will watch on the build files. To use this plugin in the chrome browser during development, go to `chrome://extensions/` and enable developer mode. Then click on `Load unpacked` and select the `dist/wallet-extension` folder in the `browser-wallet` folder. To get the updates active, you need to reopen the plugin in the browser (hitting refresh on the plugin page is not required).

Angular is using the webpack compiler instead of the modern esbuild. This is required since we need to build multiple file like the main and background file and right now it is not possible to pass a custom esbuild config to angular.

# Backend
All endpoints are available via the `http://localhost:3000` address. A swagger endpoint is available at `http://localhost:3000/api` where you can authenticate with your keycloak user credentials.