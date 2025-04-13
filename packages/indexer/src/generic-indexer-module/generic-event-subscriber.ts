import { Injectable, Inject } from '@nestjs/common';
import { AbstractEventSubscriber, LogContext, LogEvent } from '../core-module';
import {
  GenericEventLogIndexerIdentifier,
  GenericEventLogIndexer,
} from './generic-event-log-indexer';

@Injectable()
export class GenericEventSubscriber extends AbstractEventSubscriber {
  readonly eventPattern = '*:*';

  constructor(
    @Inject(GenericEventLogIndexerIdentifier)
    private genericEventLogIndexer: GenericEventLogIndexer,
  ) {
    super();
  }

  async onIndex(payload: LogEvent, context: LogContext): Promise<void> {
    const { log, parsedEvent } = payload;
    await this.genericEventLogIndexer.processLog(
      log,
      parsedEvent,
      log.blockTimestamp,
      context,
      false,
    );
  }

  async onDeindex(payload: LogEvent, context: LogContext): Promise<void> {
    const { log, parsedEvent } = payload;
    await this.genericEventLogIndexer.processLog(
      log,
      parsedEvent,
      log.blockTimestamp,
      context,
      true,
    );
  }
}
