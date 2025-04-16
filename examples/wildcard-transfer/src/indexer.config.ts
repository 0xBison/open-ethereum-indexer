import { IndexerConfig } from '@open-ethereum/indexer';
import TransferABI from './abi/transfer.json';
import { InitialSchema1742552800422 } from './output/migrations/1742552800422-InitialSchema';
import { ExampleEntitySchema1744196939464 } from './custom/migrations/1744196939464-Example';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.NODE_CHAIN_ID),
    },
    contracts: {
      ERC20: {
        abi: TransferABI,
        startBlock: 22229952,
      },
    },
  },
  database: {
    migrations: [InitialSchema1742552800422, ExampleEntitySchema1744196939464],
  },
  app: {
    disableMetrics: true,
    disableGraphqlPlayground: false,
    disableGraphql: false,
  },
};
