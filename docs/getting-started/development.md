# Development

To install all dependencies, run `pnpm install` in the root folder.

Each app has its own `project.json` with specific jobs. You can either run them via the command line or via the plugin for your editor.

The command `pnpm run init` will generate `.env` files for each app based on the example file.

For vscode are pre defined tasks in the `.vscode` folder. You can run them via the command palette or the shortcut `ctrl+shift+p` and type `Run Task`. The `Start issuer, holder, verifier` task for example will start all three apps with their frontend and backend. The keycloak instance has to be started by yourself since it is not part of the monorepo. You can find it in the `deploys/keycloak` folder and start it with `docker-compose up -d`.

## Known limitations

When you are running node based tasks and you are adding or removing a dependency, the task will stop the nx daemon will not restart by itself when there are file changes in the app. To fix this, run `pnpm exec nx reset`. After this all node based tasks will work again as expected.
