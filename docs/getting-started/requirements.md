# Requirements

- [node v20](https://nodejs.org/en/download/package-manager)
- [pnpm v9](https://pnpm.io/installation)
- [docker](https://docs.docker.com/get-docker) in case you want to use keycloak and the database in docker
- editor [plugin for nx](https://nx.dev/getting-started/editor-setup) (optional)

For an easy development setup, it is recommend to use vscode with the nx plugin to start tasks like building, testing and linting or to generate new code. You can also use Webstorm with the nx plugin, [see here](https://nx.dev/getting-started/editor-setup#official-integrations).


## Running the documentation

To run `mkdocs` locally:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
mkdocs serve
```
