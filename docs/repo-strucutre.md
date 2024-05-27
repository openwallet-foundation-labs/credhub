# Repo structure

The repository is structured as follows:
- `.github` includes specific GitHub actions workflows.
- `.vscode` includes specific settings for Visual Studio Code.
- `apps` includes all applications.
- `config` includes configuration files to run the docker containers. Each container has its own subfolder.
- `docker` includes Dockerfile for specific dependencies like keycloak.
- `docs` includes documentation for this repository.
- `patches` includes patches for specific libraries.

## Apps connection
![Overview](https://www.mermaidchart.com/raw/832e87e0-a10e-40b3-b103-ed79ad860b6e?theme=light&version=v0.1&format=svg)

To watch the code dependency between the apps and libs, you can use the following command:
```bash
npx nx graph
```
