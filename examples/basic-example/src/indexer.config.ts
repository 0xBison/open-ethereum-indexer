import { IndexerConfig } from '@open-ethereum/indexer';
import USDTAbi from './abi/USDT.json';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.NODE_CHAIN_ID),
    },
    contracts: {
      USDT: {
        abi: USDTAbi,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        // Exclude all events except Transfer
        excludeEvents: [
          'Issue',
          'Redeem',
          'Deprecate',
          'Params',
          'DestroyedBlackFunds',
          'AddedBlackList',
          'RemovedBlackList',
          'Approval',
          'Pause',
          'Unpause',
        ],
        startBlock: 22215331,
        endBlock: 22215331,
      },
    },
  },
  database: {
    entities: [],
    migrations: [],
  },
};
