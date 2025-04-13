import { Injectable, Inject } from '@nestjs/common';
import { LogContext } from '../core-module';
import { AbstractBlockSubscriber } from '../core-module/event-manager/abstract-block-subscriber';
import { BlockEvent } from '../types';
import {
  GenericEventLogIndexerIdentifier,
  GenericEventLogIndexer,
} from './generic-event-log-indexer';

@Injectable()
export class GenericBlockSubscriber extends AbstractBlockSubscriber {
  constructor(
    @Inject(GenericEventLogIndexerIdentifier)
    private genericEventLogIndexer: GenericEventLogIndexer,
  ) {
    super();
  }

  async onIndex(payload: BlockEvent, context: LogContext): Promise<void> {
    const { logs, timestamp } = payload;
    this.genericEventLogIndexer.processBlockLog(
      logs,
      timestamp,
      context,
      false,
    );
  }

  async onDeindex(payload: BlockEvent, context: LogContext): Promise<void> {
    const { logs, timestamp } = payload;
    this.genericEventLogIndexer.processBlockLog(logs, timestamp, context, true);
  }
}
