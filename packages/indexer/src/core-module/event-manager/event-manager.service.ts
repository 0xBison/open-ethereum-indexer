import { Inject, Injectable } from '@nestjs/common';
import { matchesEventPattern } from './event-pattern-matcher';
import {
  onBlockResponder,
  EventHandler,
  onContractResponder,
  LogEvent,
} from './types';
import { ConfigService } from '../../config-module';
import { LogDescription } from 'ethers/lib/utils';
import { BlockEvent } from '../../types';
import { ModuleRef } from '@nestjs/core';
import {
  SQLTransactionService,
  SQLTransactionServiceIdentifier,
} from '../../sql-transaction-module';

export const EVENT_MANAGER_SERVICE = 'EVENT_MANAGER_SERVICE';

// Static handlers that will be used to initialize the service
const staticBlockHandlers: onBlockResponder[] = [];
const staticEventHandlers: EventHandler[] = [];

// Static registration methods
export function onBlock(handler: onBlockResponder): void {
  staticBlockHandlers.push(handler);
}

export function onEvent(pattern: string, handler: onContractResponder): void {
  staticEventHandlers.push({ pattern, handlers: handler });
}

@Injectable()
export class EventManagerService {
  private blockHandlers: onBlockResponder[] = [];
  private eventHandlers: EventHandler[] = [];

  constructor(
    private configService: ConfigService,
    private moduleRef: ModuleRef,
    @Inject(SQLTransactionServiceIdentifier)
    private transactionService: SQLTransactionService,
  ) {
    // Copy static handlers to instance handlers
    this.blockHandlers = [...staticBlockHandlers];
    this.eventHandlers = [...staticEventHandlers];
  }

  getContractNameForAddress(address: string): string | null {
    return (
      Object.keys(this.configService.getConfig().contracts).find(
        (key) =>
          this.configService
            .getConfig()
            .contracts[key].address?.toLowerCase() === address.toLowerCase(),
      ) || null
    );
  }

  getContractAndEventName(
    address: string,
    logDescription: LogDescription,
  ): { contractName: string | null; eventName: string } {
    const contractName = this.getContractNameForAddress(address);
    const eventName = logDescription.name;

    return { contractName, eventName };
  }

  /**
   * Registers a handler for block-level events.
   * @param handler - Object containing onIndex and/or onDeindex functions
   */
  onBlock(handler: onBlockResponder): void {
    this.blockHandlers.push(handler);
  }

  /**
   * Registers a handler for contract events with pattern matching.
   * @param pattern - Event pattern in format "ContractName:EventName" (supports wildcards)
   * @param handler - Object containing onIndex and/or onDeindex functions
   */
  onEvent(pattern: string, handler: onContractResponder): void {
    this.eventHandlers.push({ pattern, handlers: handler });
  }

  /**
   * Emits a block index event to all registered block handlers.
   * @param payload - Data to be passed to the handlers
   */
  async emitBlockIndex(payload: BlockEvent): Promise<void> {
    const entityManager = this.transactionService.getEntityManager();

    for (const handler of this.blockHandlers) {
      if (handler.onIndex) {
        await handler.onIndex(payload, {
          moduleRef: this.moduleRef,
          entityManager,
        });
      }
    }
  }

  /**
   * Emits a block deindex event to all registered block handlers.
   * @param payload - Data to be passed to the handlers
   */
  async emitBlockDeindex(payload: BlockEvent): Promise<void> {
    const entityManager = this.transactionService.getEntityManager();

    for (const handler of this.blockHandlers) {
      if (handler.onDeindex) {
        await handler.onDeindex(payload, {
          moduleRef: this.moduleRef,
          entityManager,
        });
      }
    }
  }

  /**
   * Emits a contract event index to matching handlers.
   * @param payload - Data to be passed to the handlers
   */
  async emitEventIndex(payload: LogEvent): Promise<void> {
    const entityManager = this.transactionService.getEntityManager();

    const { contractName, eventName } = this.getContractAndEventName(
      payload.log.address,
      payload.parsedEvent,
    );

    for (const handler of this.eventHandlers) {
      if (
        matchesEventPattern(contractName, eventName, handler.pattern) &&
        handler.handlers.onIndex
      ) {
        await handler.handlers.onIndex(payload, {
          moduleRef: this.moduleRef,
          entityManager,
        });
      }
    }
  }

  /**
   * Emits a contract event deindex to matching handlers.
   * @param payload - Data to be passed to the handlers
   */
  async emitEventDeindex(payload: LogEvent): Promise<void> {
    const { contractName, eventName } = this.getContractAndEventName(
      payload.log.address,
      payload.parsedEvent,
    );

    const entityManager = this.transactionService.getEntityManager();

    for (const handler of this.eventHandlers) {
      if (
        matchesEventPattern(contractName, eventName, handler.pattern) &&
        handler.handlers.onDeindex
      ) {
        await handler.handlers.onDeindex(payload, {
          moduleRef: this.moduleRef,
          entityManager,
        });
      }
    }
  }
}
