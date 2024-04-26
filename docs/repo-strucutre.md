# Repo structure

The repository is structured as follows:
- `.github` includes specific GitHub actions workflows.
- `.vscode` includes specific settings for Visual Studio Code.
- `apps` includes all applications.
- `config` includes configuration files to run the docker containers. Each container has its own subfolder.
- `docker` includes Dockerfiles to build the docker images. Dockerfiles also include the build part so no pre compiled code is injected from a previous step.
- `docs` includes documentation for this repository.
- `patches` includes patches for specific dependencies.