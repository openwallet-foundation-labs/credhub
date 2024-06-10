# Deploys
In this directory you will find the deployment files for the services with `docker-compose`. The apps are grouped together with their front- and backend component in one compose file.
Each folder includes

- `docker-compose.yml` file to start the services
- `.env` file to set the environment variables
- a configuration folder that will mount information into the containers


## Running in the cloud
TODO: add information about how to deploy the services in the cloud and what configurations are needed.


## Testing locally with docker
When running the services via localhost, there is one problem to deal with. When `keycloak` is run locally and the frontend is calling it via `localhost:8080`, the token will have the `iss` value set to `localhost:8080`. But the backend services running in docker are not able to resolve `localhost:8080` to reach the host machine.

To solve this problem in `Windows` and `MacOS`, you can use `host.docker.internal` instead of `localhost` inside the configs to reach the host machine.
TODO: mention a workaround for Linux users.
