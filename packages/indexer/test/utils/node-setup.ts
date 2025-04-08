import { GenericContainer, StartedTestContainer } from 'testcontainers';

export interface NodeSetup {
  setup(): Promise<string>; // Returns RPC URL
  teardown(): Promise<void>;
}

// For manual debugging - connects to a locally running node
export class LocalNodeSetup implements NodeSetup {
  private rpcUrl: string;

  constructor(rpcUrl = 'http://127.0.0.1:8545') {
    this.rpcUrl = rpcUrl;
  }

  async setup(): Promise<string> {
    console.log(`Using local node at ${this.rpcUrl}`);
    return this.rpcUrl;
  }

  async teardown(): Promise<void> {
    // Nothing to tear down for local node
    console.log('Local node remains running');
  }
}

// For CI/automated testing - uses TestContainers
export class ContainerizedNodeSetup implements NodeSetup {
  private container: StartedTestContainer | null = null;
  private rpcUrl: string | null = null;

  async setup(): Promise<string> {
    this.container = await new GenericContainer('0xbison/foundry-anvil')
      .withExposedPorts(8545)
      .start();

    // For streaming logs - but just use the other strategy, cleaner

    // const stream = await this.container.logs();

    // stream
    //   .on('data', (line) => console.log(line))
    //   .on('err', (line) => console.error(line))
    //   .on('end', () => console.log('Stream closed'));

    // Get the mapped port
    const port = this.container.getMappedPort(8545);
    const host = this.container.getHost();
    this.rpcUrl = `http://${host}:${port}`;

    console.log(`Anvil RPC URL: ${this.rpcUrl}`);

    return this.rpcUrl;
  }

  async teardown(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      console.log('Containerized node stopped');
    }
  }
}

// Factory to get the appropriate node setup
export function getNodeSetup(useContainer = false): NodeSetup {
  return useContainer ? new ContainerizedNodeSetup() : new LocalNodeSetup();
}
