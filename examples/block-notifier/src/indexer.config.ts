import { IndexerConfig } from '@open-ethereum/indexer';
import { entityRegistry } from '@open-ethereum/indexer';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
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
