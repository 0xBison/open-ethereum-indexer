import { IndexerConfig, mergeEventAbis } from '@open-ethereum/indexer';
import { entityRegistry } from '@open-ethereum/indexer';
import proxyAbi from './abi/ComptrollerProxy.json';
import implementationAbi from './abi/ComptrollerImplementation.json';
import { InitialSchema1743919359054 } from './output/migrations/1743919359054-InitialSchema';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
    },
    contracts: {
      Comptroller: {
        abi: mergeEventAbis(proxyAbi, implementationAbi),
        address: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
        startBlock: 22199590,
        endBlock: 22199611,
      },
    },
  },
  database: {
    migrations: [InitialSchema1743919359054],
  },
};
