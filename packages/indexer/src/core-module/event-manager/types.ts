import { Log } from '@ethersproject/abstract-provider';
import { LogDescription } from 'ethers/lib/utils';
import { BlockEvent } from '../../types';

export interface LogDetails extends Log {
  blockTimestamp: number;
}

export interface LogEvent {
  log: LogDetails;
  parsedEvent: LogDescription;
}

export type onBlockResponder = {
  onIndex?: (payload: BlockEvent) => Promise<void> | void;
  onDeindex?: (payload: BlockEvent) => Promise<void> | void;
} & (
  | { onIndex: (payload: BlockEvent) => Promise<void> | void }
  | { onDeindex: (payload: BlockEvent) => Promise<void> | void }
);

export type onContractResponder = {
  onIndex?: (payload: LogEvent) => Promise<void> | void;
  onDeindex?: (payload: LogEvent) => Promise<void> | void;
} & (
  | { onIndex: (payload: LogEvent) => Promise<void> | void }
  | { onDeindex: (payload: LogEvent) => Promise<void> | void }
);

export interface EventHandler {
  pattern: string;
  handlers: onContractResponder;
}
