import { IndexerConfig } from 'indexer-module/indexer.module';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/',
      chainId: 1,
    },
    contracts: {},
  },
  database: {
    entities: [],
    migrations: [],
  },
  app: {
    disableMetrics: true,
  },
};
