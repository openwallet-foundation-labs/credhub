# Deploys
In this directory you will find the deployment files for the services with `docker-compose`. The apps are grouped together with their front- and backend component in one compose file.
Each folder includes:

- `docker-compose.yml` file to start the services
- `.env` file to set the environment variables
- a configuration folder that will mount information into the containers

To start you should copy the `.env.example` file to `.env` and fill in the necessary information, the `.env` is excluded from the repository to avoid leaking sensitive information.
This command will do the job:
```bash
find . -type f -name ".env.example" -exec sh -c 'cp "$0" "${0%.example}"' {} \;
```

## Running in the cloud
TODO: add information about how to deploy the services in the cloud and what configurations are needed.


## Testing locally with docker
When running the services via localhost, there is one problem to deal with. When `keycloak` is run locally and the frontend is calling it via `localhost:8080`, the token will have the `iss` value set to `localhost:8080`. But the backend services running in docker are not able to resolve `localhost:8080` to reach the host machine.

To solve this problem in `Windows` and `MacOS`, you can use `host.docker.internal` instead of `localhost` inside the configs to reach the host machine.
TODO: mention a workaround for Linux users.

Going via `host.docker.internal` will trigger warnings since it requires a tls connection. To allow `http` connections, you need to set the value `oidcAllowHttp` in the config.json to `true`.

## Running in kubernetes
Right now the services are not designed to be scaled horizontally. For development purposes or small use cases this should be fine for now.

TODO: create helm charts so they can deployed in kubernetes.
