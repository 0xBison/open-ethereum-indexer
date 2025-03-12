import { Log } from '@ethersproject/abstract-provider';
import { LogDescription } from 'ethers/lib/utils';

export interface LogDetails extends Log {
  blockTimestamp: number;
}

export interface LogEvent {
  log: LogDetails;
  parsedEvent: LogDescription;
}

export type onBlockResponder = {
  onIndex?: (payload: any) => Promise<void> | void;
  onDeindex?: (payload: any) => Promise<void> | void;
} & (
  | { onIndex: (payload: any) => Promise<void> | void }
  | { onDeindex: (payload: any) => Promise<void> | void }
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
