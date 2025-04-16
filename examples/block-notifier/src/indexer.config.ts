import { IndexerConfig } from '@open-ethereum/indexer';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
    },
    contracts: {},
  },
  database: {
    migrations: [],
  },
  app: {
    disableMetrics: true,
  },
};
