# Holder Browser Extension

The browser extension is a client that available as a browser extension. Right now there is only a chrome extension available. Like the holder app, the business logic is implemented in the backend, the client is only responsible for displaying the data and interacting with the user.

Most of the code is shared between the holder app and the browser extension. The main difference is the way how to interact with QR-Codes. For this the extension is using the `chrome.tabs` API to inject a content script into the current tab. This script is responsible for scanning all images on the page and check if it is a QR-Code. If a QR-Code is found with the correct schema like `oid4vci://` or `oid4vp://`, the extension will render a button next to the QR-Code that the user can click to start the scanning process.

## Tech stack

Angular is used to build the frontend with the webpack builder. The older builder is used because it allows to compile multiple entry points.
Esbuild could also be used to speed up the build, but then two jobs have to be executed to compile the app and the background script.

## Configuration

In the app initialization, the app is loading the `config.json` file from the asset folder. This approach allows to change the configuration without rebuilding the app. This configuration can be replaced in the compiled extension. But when the extension was pushed to the Chrome Web Store, the configuration is fixed.

## Authentication

Chapter is equal to the [holder app](../holder/holder-app.md#authentication).

## Language support

Chapter is equal to the [holder app](../holder/holder-app.md#language-support).
