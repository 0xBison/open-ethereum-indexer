import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import {
  GenericEventLogIndexer,
  GenericEventLogIndexerIdentifier,
} from './generic-event-log-indexer';
import {
  EventManagerService,
  EVENT_MANAGER_SERVICE,
  onEvent,
  onBlock,
} from '../core-module/event-manager/event-manager.service';
import { LogEvent } from '../core-module/event-manager/types';

// Register the generic event log indexer with the event manager statically
// This will be picked up when the EventManagerService is instantiated
// onBlock({
//   onIndex: async (payload) => {
//     // This will be handled by the GenericEventLogIndexerAdapter when it's instantiated
//     // console.log('ON BLOCK sdfsdsd');
//   },
//   onDeindex: async (payload) => {
//     // This will be handled by the GenericEventLogIndexerAdapter when it's instantiated
//   },
// });

// onEvent('*:*', {
//   onIndex: async (payload) => {
//     // This will be handled by the GenericEventLogIndexerAdapter when it's instantiated
//     // console.log('ON EVENT sdfsdsd');
//   },
//   onDeindex: async (payload) => {
//     // This will be handled by the GenericEventLogIndexerAdapter when it's instantiated
//   },
// });

@Injectable()
export class GenericEventLogIndexerAdapter implements OnModuleInit {
  constructor(
    @Inject(GenericEventLogIndexerIdentifier)
    private genericEventLogIndexer: GenericEventLogIndexer,
    @Inject(EVENT_MANAGER_SERVICE)
    private eventManager: EventManagerService,
  ) {}

  onModuleInit() {
    // Re-register with the actual implementation
    this.eventManager.onBlock({
      onIndex: async (payload) => {
        const { logs, blockTimestamp } = payload;
        this.genericEventLogIndexer.processBlockLog(
          logs,
          blockTimestamp,
          false,
        );
      },
      onDeindex: async (payload) => {
        const { logs, blockTimestamp } = payload;
        this.genericEventLogIndexer.processBlockLog(logs, blockTimestamp, true);
      },
    });

    this.eventManager.onEvent('*:*', {
      onIndex: async (payload: LogEvent) => {
        console.log('ON EVENT sdfsdsd');
        const { log, parsedEvent } = payload;
        await this.genericEventLogIndexer.processLog(
          log,
          parsedEvent,
          log.blockTimestamp,
          false,
        );
      },
      onDeindex: async (payload: LogEvent) => {
        console.log('ON DEINDEX sdfsdsd');
        const { log, parsedEvent } = payload;
        await this.genericEventLogIndexer.processLog(
          log,
          parsedEvent,
          log.blockTimestamp,
          true,
        );
      },
    });
  }
}
