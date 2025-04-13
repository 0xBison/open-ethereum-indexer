import { Log } from '@ethersproject/abstract-provider';
import { LogDescription } from 'ethers/lib/utils';
import { BlockEvent } from '../../types';
import { ModuleRef } from '@nestjs/core';
import { EntityManager } from 'typeorm';

export interface LogDetails extends Log {
  blockTimestamp: number;
}

export interface LogEvent {
  log: LogDetails;
  parsedEvent: LogDescription;
}

export interface LogContext {
  moduleRef: ModuleRef;
  entityManager: EntityManager;
}

export type onBlockResponder = {
  onIndex?: (payload: BlockEvent, context: LogContext) => Promise<void> | void;
  onDeindex?: (
    payload: BlockEvent,
    context: LogContext,
  ) => Promise<void> | void;
} & (
  | {
      onIndex: (
        payload: BlockEvent,
        context: LogContext,
      ) => Promise<void> | void;
    }
  | {
      onDeindex: (
        payload: BlockEvent,
        context: LogContext,
      ) => Promise<void> | void;
    }
);

export type onContractResponder = {
  onIndex?: (payload: LogEvent, context: LogContext) => Promise<void> | void;
  onDeindex?: (payload: LogEvent, context: LogContext) => Promise<void> | void;
} & (
  | {
      onIndex: (payload: LogEvent, context: LogContext) => Promise<void> | void;
    }
  | {
      onDeindex: (
        payload: LogEvent,
        context: LogContext,
      ) => Promise<void> | void;
    }
);

export interface EventHandler {
  pattern: string;
  handlers: onContractResponder;
}
