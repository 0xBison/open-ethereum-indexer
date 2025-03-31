import { Log } from '@ethersproject/abstract-provider';

export interface BlockEvent {
  hash: string;
  number: number;
  parent: string;
  timestamp: number;
  logs: Array<Log>;
}
