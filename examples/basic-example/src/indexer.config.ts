import { IndexerConfig } from '@open-ethereum/indexer';
import { entityRegistry } from '@open-ethereum/indexer';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/',
      chainId: 1,
    },
    contracts: {},
  },
  database: {
    entities: entityRegistry.getAll(),
    migrations: [],
  },
  app: {
    disableMetrics: true,
  },
};
