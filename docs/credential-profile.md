# Credential Profile
The following algorithms were chosen. Instead of supporting as much as possible, we decided to focus on the architecture reference framework to be aligned with the EUDI Wallet projects.

- Issuance and Presentation protocol: [Oid4vc](https://openid.net/sg/openid4vc/) for issuing and presenting credentials
- credential format: [SD-JWT-VC](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html)
- Signing algorithm: P-256
- Key management holder: Json Web Key, cnf binding
- Key management issuer: [JWT Issuer Metadata](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html#name-jwt-vc-issuer-metadata), X509 and DID will come soon
- Status Management: [Token Status List](https://drafts.oauth.net/draft-ietf-oauth-status-list/draft-ietf-oauth-status-list.html)
