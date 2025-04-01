import { BlockEvent } from '../types';

export interface BlockRange {
  fromBlock: number;
  toBlock: number;
}

export interface BlocksBehind {
  latestBlock: BlockEvent | null;
  blocksElapsed: number;
  latestBlockProcessed: BlockEvent | null;
}

export enum SyncStatus {
  AWAITING_INITIALIZATION = 'AWAITING_INITIALIZATION', // Loop hasn't started i.e. we havent called watch
  FETCHING_START_BLOCK = 'FETCHING_START_BLOCK', // Start block has been requested. Implicitly, running here
  RUNNING = 'RUNNING', // Loop is running fine, safe to stop.
  STOPPING = 'STOPPING', // When stop has been initialized but still in progress. not safe to start here.
  STOPPED = 'STOPPED', // Is stopped. or never started. safe to start from here.
  TERMINATED = 'TERMINATED', // Loop has been terminated.
}
