# Modular Wallet

Instead of building a framework for wallets in one programming language, this repo will provide multiple web services that can be used to handle the different tasks when working with wallets.

It includes
- a minimal issuer and verifier service
- a cloud wallet and a progressive web app and browser plugin to interact with it

# Why a cloud wallet
A cloud wallet is able to move the whole complexity of the SSI algorithms to the server side, so the clients only need to render the data. This makes the development of new clients or integrating it in existing applications much easier.
Besides it allows the user to access his credentials from multiple devices without the need to sync them.

Of course the user is loosing offline capabilities and has to trust the server to not misuse his data. But this is a tradeoff that can be acceptable for many use cases when you want to start with verifiable credentials with great user experience and low development effort.

# Tech Stack
- transport: [Oid4vc](https://openid.net/sg/openid4vc/) for issuing and presenting credentials
- credential format: [SD-JWT-VC](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html)
- Key management holder: Json Web Key, cnf binding
- Key management issuer: [JWT Issuer Metadata](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html#name-jwt-vc-issuer-metadata), X509 and DID will come soon
- Revocation mechanism: [Status List](https://datatracker.ietf.org/doc/html/draft-looker-oauth-jwt-cwt-status-list-01) (not implemented yet)

# More information
- [Repo structure](./docs/repo-strucutre.md)
- [Running docker images](./docs/running-docker.md)
- [Development](./docs/development.md)

# Contributing
Contributions are always welcome. When opening a pull request, please make sure it is signed and explain the changes you made. In case you want to discuss about a new feature/change, open an issue and we can discuss it there.

# License
This project is licensed under the Apache 2.0 License