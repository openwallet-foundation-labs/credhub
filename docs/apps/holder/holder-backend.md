# Holder backend

The holder backend is a service for managing the wallet of multiple users. It will store the credentials and will interact with the different relying parties to receive or present credentials.

## Tech stack

The backend is based on nestjs, where all endpoints are published as rest api. The OpenAPI interface can be found at `/api`.

## Configuration

Configuration is done via environment variables. By default the service will use the `.env` file in the app folder, but for production you can pass the variables via the environment into the docker container.
The required variables will be checked on startup. If a variable is missing, the service will exit with an error message.

## Database

The backend is using `typeorm`, allowing to use different database. Right now it supports `sqlite` and `postgres`. The type is define via the `DB_TYPE` environment variable. The default value is `postgres`.

## Key management

There are two different key management systems supported by the backend to manage the keys of the users.

- `db`: the keys are stored in the database
- `vault`: the keys are stored in a hashicorp vault instance

The type is set via `KM_TYPE`, the default value is `db`.

The implementation of other vault systems or other approaches are possible by implementing the `KeysService` interface.

The key management option is equal for all users and can not be set individually.

## Authentication

Authentication is realized via open id connect. The JWT needs to have the role `holder` to be able to access the endpoints.

To validate if the token got revoked, the backend needs a service account with the required permissions.

## Health check

The service is exposing a health check endpoint at `/health`. It will return a `200` status code if the service is healthy.
