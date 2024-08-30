# Holder App

The holder app is a client that is interacting with the holder backend. THe business logic is implemented in the backend, the client is only responsible for displaying the data and interacting with the user.

The application is responsive, so it can be used on mobile devices as well as on desktops.

There are two ways to receive a credential:

- **Camera**: The user can scan a QR code that contains either a OID4VCI URL or a OID4VP URL. For this action the permission of the camera is required.
- **Clipboard**: When going into the scan view, the application will automatically check the clipboard for a valid URL. This validation is done by checking if the URL starts with `oid4vci://` or `oid4vp://` on the client. For this action the permission of the clipboard is required. In case there was no permission granted to read from the clipboard, the user is able to manually paste the URL into the input field via the menu icon in the top right corner.

## Tech stack

Angular is used to build the frontend with the esbuild builder. It is also built as a Progressive Web App (PWA) to allow the user to install the app on the device.

## Configuration

In the app initialization, the app is loading the `config.json` file from the asset folder. This approach allows to change the configuration without rebuilding the app. The configuration can be mounted into the docker container.

The file includes the following properties:

- backendUrl: the url of the backend service

In development mode, you need to update the `config.json` file in the `src/assets` folder. In production, you can mount the file into the docker container.
TODO: to avoid a cached config file, a random parameter should be added to the url.

## Authentication

The application will send a GET request to `$backendUrl/auth` to get the OIDC configuration. The configuration will be used to authenticate the user via the keycloak instance.

It is also possible on the login screen to change the backend url to a different instance. This is useful for testing different environments or to use one hosted client instance. In this case the manuel configured backendUrl is stored in the local storage. When the app is started, it will prioritize the stored url over the one in the config file.

## Language support

The application is right now only available in English. A multi language support is planned for the future.
