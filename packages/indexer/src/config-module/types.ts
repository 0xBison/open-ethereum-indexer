import { JsonFragment } from '@ethersproject/abi';

export type ABI = JsonFragment[];

export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
}

export interface Config {
  network: NetworkConfig;

  contracts: {
    [key: string]: {
      abi: ABI;
      address?: string;
      startBlock?: number;
      endBlock?: number;
      excludeEvents?: string[];
    };
  };
}

export interface EventInfo {
  eventName: string;
  contractAddresses: string[];
  eventFragment: JsonFragment;
  contractBlockRanges: {
    [address: string]: {
      startBlock: number;
      endBlock: number;
    };
  };
}

export interface TopicList {
  [topicHash: string]: EventInfo;
}

export interface TopicFilter {
  topic: string;
  addresses?: string[];
}
