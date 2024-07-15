import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { HolderBackend } from './holder-backend';

/**
 * HolderBackend to manage the holder backend container
 */
export class HolderFrontend {
  instance!: StartedTestContainer;

  static async init(backend: HolderBackend) {
    const instance = new HolderFrontend(backend);
    await instance.start();
    return instance;
  }

  constructor(private backend: HolderBackend) {}

  /**
   * Start the holder backend container
   * @param network
   */
  async start() {
    this.instance = await new GenericContainer(
      'ghcr.io/openwallet-foundation-labs/credhub/holder-app'
    )
      .withExposedPorts(80)
      .withStartupTimeout(2000)
      .withName('holder-frontend')
      .withEnvironment({
        BACKEND_URL: `http://localhost:${this.backend.instance.getMappedPort(
          3000
        )}`,
      })
      .start();
  }

  async stop() {
    await this.instance.stop();
  }
}
