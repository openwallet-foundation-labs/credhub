# CredHub

CredHub is comprehensive monorepo including a cloud wallet for natural persons together with a minimal issuer and verifier service. The cloud wallet will host all credentials and key pairs, including the business logic to receive and present credentials.

# Why a cloud wallet
A cloud wallet is able to move the whole complexity of the SSI algorithms to the server side, so the clients only need to render the data. This makes the development of new clients or integration into existing applications much easier. It also provides an equal security level for all users and does not exclude any smartphones because of their hardware capabilities. Besides that it allows the user to access his credentials from multiple devices without the need to sync them.

Of course the user is losing offline capabilities and has to trust the server to not misuse personal data. But this is a tradeoff that can be acceptable for many use cases when you want to start with verifiable credentials with great user experience and low development effort.

# Tech Stack
- Programming language: Typescript, Node >= v18
- NX as monorepo manager
- Frontend-Framework: [Angular](https://angular.dev/)
- Backend-Framework: [Nestjs](https://nestjs.com/)

## Credential Profile
The following algorithms were chosen. Instead of supporting as much as possible, we decided to focus on the architecture reference framework to be aligned with the EUDI Wallet projects.

- Issuance and Presentation protocol: [Oid4vc](https://openid.net/sg/openid4vc/) for issuing and presenting credentials
- credential format: [SD-JWT-VC](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html)
- Signing algorithm: P-256
- Key management holder: Json Web Key, cnf binding
- Key management issuer: [JWT Issuer Metadata](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html#name-jwt-vc-issuer-metadata), X509 and DID will come soon
- Status Management: [Token Status List](https://drafts.oauth.net/draft-ietf-oauth-status-list/draft-ietf-oauth-status-list.html)

## Apps connection
![Overview](https://www.mermaidchart.com/raw/832e87e0-a10e-40b3-b103-ed79ad860b6e?theme=light&version=v0.1&format=svg)

## Issuance flow

![Issuance process](https://www.mermaidchart.com/raw/36b70fe7-7b53-448a-8f65-2f29b1c515af?theme=light&version=v0.1&format=svg)

## Presentation flow
![Presentation flow](https://www.mermaidchart.com/raw/fd2e141e-9a29-43ee-b16f-2bafc701bbb0?theme=light&version=v0.1&format=svg)

# More information
- [Repo structure](./docs/repo-strucutre.md)
- [Running docker images](./docs/running-docker.md)
- [Development](./docs/development.md)

# Contributing
Contributions are always welcome. When opening a pull request, please make sure it is signed and explain the changes you made. In case you want to discuss about a new feature/change, open an issue and we can discuss it there.

# License
This project is licensed under the Apache 2.0 License
