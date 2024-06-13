# Repo structure

The repository is structured as follows:

- `.github` includes specific GitHub actions workflows.
- `.vscode` includes specific settings for Visual Studio Code.
- `apps` includes all applications.
- `deploys` includes deployment configurations for the different apps.
- `docker` includes Dockerfile for specific dependencies like keycloak.
- `docs` includes documentation for this repository.
- `patches` includes patches for specific libraries.

## Apps connection
![Overview](https://www.mermaidchart.com/raw/832e87e0-a10e-40b3-b103-ed79ad860b6e?theme=light&version=v0.1&format=svg)

To watch the code dependency between the apps and libs, you can use the following command:
```bash
npx nx graph
```


## Apps connection
![Overview](https://www.mermaidchart.com/raw/832e87e0-a10e-40b3-b103-ed79ad860b6e?theme=light&version=v0.1&format=svg)

## Issuance flow

![Issuance process](https://www.mermaidchart.com/raw/36b70fe7-7b53-448a-8f65-2f29b1c515af?theme=light&version=v0.1&format=svg)

## Presentation flow
![Presentation flow](https://www.mermaidchart.com/raw/fd2e141e-9a29-43ee-b16f-2bafc701bbb0?theme=light&version=v0.1&format=svg)
