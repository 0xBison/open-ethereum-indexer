import { Log } from '@ethersproject/abstract-provider';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventParser, EventParserIdentifier } from './event-parser';
import {
  EVENT_MANAGER_SERVICE,
  EventManagerService,
} from '../event-manager/event-manager.service';
import { LogEvent } from '../event-manager/types';
import { BlockEvent } from 'ethereum-client-module/types';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

export const BlockProcessorServiceIdentifier = 'BlockProcessorService';

@Injectable()
export class BlockProcessorService {
  private readonly logger = new Logger(BlockProcessorService.name);

  constructor(
    @Inject(EventParserIdentifier)
    private eventParser: EventParser,
    @Inject(EVENT_MANAGER_SERVICE)
    private eventManager: EventManagerService,
    @InjectMetric('logs_count_per_block')
    public logCountPerBlock: Histogram<string>,
    @InjectMetric('block_number') public blockNumberGauge: Gauge<string>,
    @InjectMetric('latest_indexed_block_timestamp')
    public latestBlockTimeGauge: Gauge<string>,
    @InjectMetric('block_process_iteration_duration')
    public blockProcessIterationDuration: Histogram<string>,
    @InjectMetric('indexed_blocks') public indexedBlockCounter: Counter<string>,
  ) {}

  /**
   * Given a list of block events, decides whether the logs are logs we care about and if so
   * calls the `processLog` method to index them.
   *
   * @param blockEventsToProcess The block events with logs to add or remove
   * @param areRemoved Whether the blocks are reorged blocks or not
   */
  public async processBlockEvents(
    blockEventsToProcess: Array<BlockEvent>,
    areRemoved = false,
  ): Promise<void> {
    // iterate over the event logs included in the new block events, and process them
    for (const blockEvent of blockEventsToProcess) {
      // set the start timestamp for this block process iteration
      const startBlockEventToProcessTimestamp = Date.now();

      if (!areRemoved) {
        this.eventManager.emitBlockIndex('hello');
      } else {
        this.eventManager.emitBlockDeindex('hello');
      }

      // when reorg (areRemoved = true) we reverse the logs which is important to undo
      // copy the logs when reversing to ensure they arent mutated and stored in reverse order...
      const logsToProcess = areRemoved
        ? [...blockEvent.logs].reverse()
        : blockEvent.logs;
      this.logCountPerBlock.observe(logsToProcess.length);

      await this.processLogs(logsToProcess, blockEvent.timestamp, areRemoved);

      // Increment for new indexed blocks
      if (!areRemoved) {
        this.indexedBlockCounter.inc();
      }

      this.blockNumberGauge.set(blockEvent.number);
      this.latestBlockTimeGauge.set(blockEvent.timestamp);
      // get the end timestamp of the block process iteration
      const endBlockEventToProcessTimestamp = Date.now();
      // get the block process iteration duration from the 2 timestamps
      const blockProcessIterationDuration =
        endBlockEventToProcessTimestamp - startBlockEventToProcessTimestamp;

      this.blockProcessIterationDuration.observe(blockProcessIterationDuration);
    }
  }

  public async processLogs(
    logs: Array<Log>,
    blockTimestamp: number,
    areRemoved = false,
  ): Promise<void> {
    // First emit block-level events
    const blockPayload = {
      logs,
      blockTimestamp,
      areRemoved,
    };

    if (areRemoved) {
      await this.eventManager.emitBlockDeindex(blockPayload);
    } else {
      await this.eventManager.emitBlockIndex(blockPayload);
    }

    // Then process individual logs
    for (const log of logs) {
      const topicHash = log.topics[0];
      const parsedEvent = this.eventParser.getParsedEvent(topicHash, log);

      if (!parsedEvent) {
        continue;
      }

      const logEvent: LogEvent = {
        log: { ...log, blockTimestamp },
        parsedEvent,
      };

      // Emit the appropriate event
      if (areRemoved) {
        await this.eventManager.emitEventDeindex(logEvent);
      } else {
        await this.eventManager.emitEventIndex(logEvent);
      }
    }
  }
}
