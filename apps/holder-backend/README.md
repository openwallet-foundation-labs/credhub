# Holder backend

The holder backend is a service managing the credentials and keys of multiple users. Beside storing the information, it is also handling the communication with relying parties, so performs also the business logic. The authentication is done via openid connect with keycloak.

## Tech stack
The backend is based on nestjs, where all endpoints are published as rest api. The OpenAPI interface can be found at `/api`.

## Configuration
Configuration is done via environment variables. By default the service will use the `.env` file in the root folder, but for production you can pass the variables via the environment into the docker image.
The required variables will be checked on startup. If a variable is missing, the service will exit with an error message.

## Database
The backend is using `typeorm`, allowing to use different database. Right now it supports `sqlite` and `postgres`. The type is define via the `DB_TYPE` environment variable. The default value is `postgres`.

## Key management
Two different key management systems are supported by the backend.
- `db`: the keys are stored unencrypted in the database
- `vault`: the keys are stored in a hashicorp vault instance

The type is set via `KM_TYPE`, the default value is `db`. The type storage is set for all users. We could implement to use different systems for different users in the future if we see a demand.

The implementation of other vault systems or other approaches are possible by implementing the `KeysService` interface.

## Authentication

Authentication is realized via open id connect. There is no event the service is listening on the authentication service like keycloak. If a valid token is sent, the service will use the `sub` as the unique user id.
When the user deletes his account, the backend will delete all records related to the user. It will also send a request to keycloak to delete the user.
The service needs a valid client that is able to validate, it also needs to be configured as a service account with the role to delete users.

In case another authentication system is needed, the `OIDCClient` interface has to be implemented.

## Health check
The service is exposing a health check endpoint at `/health`. It will return a `200` status code if the service is healthy.
