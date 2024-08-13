# Verifier backend

The verifier backend is a service for verifying credentials of users. The verification templates are stored in the filesystem and will be loaded on demand.

## Tech stack

The backend is based on nestjs, where all endpoints are published as rest api. The OpenAPI interface can be found at `/api`.

## Configuration

Configuration is done via environment variables. By default the service will use the `.env` file in the root folder, but for production you can pass the variables via the environment into the docker image.
The required variables will be checked on startup. If a variable is missing, the service will exit with an error message.

## Key management

Two different key management systems are supported by the backend.

- `file`: the keys are stored unencrypted in the file system
- `vault`: the keys are stored in a hashicorp vault instance

The type is set via `KM_TYPE`, the default value is `file`.

The implementation of other vault systems or other approaches are possible by implementing the `KeysService` interface.

## Authentication

Authentication is realized via open id connect. The JWT needs to have the role `verifier` to be able to access the endpoints.

## Health check

The service is exposing a health check endpoint at `/health`. It will return a `200` status code if the service is healthy.
