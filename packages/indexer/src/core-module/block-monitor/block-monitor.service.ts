import { Log } from '@ethersproject/abstract-provider';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import {
  EthereumHttpClient,
  EthereumHttpClientProviderIdentifier,
} from '../../ethereum-client-module/ethereum-http-client';
import {
  BlockProcessorService,
  BlockProcessorServiceIdentifier,
} from '../block-processor/block-processor';
import { BlockRange, BlocksBehind, SyncStatus } from '../types';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge, Histogram } from 'prom-client';
import { CoreConfig } from '../core.config';
import { getNextBlockRange } from '../utils/get-next-block-range';
import { sleep } from '../utils/sleep';
import { ConfigService, getTopicFiltersToSubscribe } from '../../config-module';
import { JsonStore, JsonStoreIdentifier } from 'nest-json-store';
import { LATEST_BLOCK, LATEST_INDEXED_BLOCK } from './constants';
import { BlockEvent } from '../../types';

export const BlockMonitorServiceIdentifier = 'BlockMonitorServiceIdentifier';

/**
 * BlockMonitor maintains a consistent representation of the latest X blocks (where X is enforced by the
 * supplied stack) handling block re-orgs and network disruptions gracefully. It can be started from
 * any arbitrary block height, and will emit both block added and removed events.
 */
@Injectable()
export class BlockMonitorService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(BlockMonitorService.name);

  private status: SyncStatus;

  constructor(
    @Inject(EthereumHttpClientProviderIdentifier)
    private client: EthereumHttpClient,
    @Inject(BlockProcessorServiceIdentifier)
    private blockProcessorService: BlockProcessorService,
    private config: CoreConfig,
    private configService: ConfigService,
    @Inject(JsonStoreIdentifier) private cacheDatabase: JsonStore,
    @InjectMetric('block_number') public blockNumberGauge: Gauge<string>,
  ) {
    this.status = SyncStatus.AWAITING_INITIALIZATION;
  }

  onModuleInit() {
    this.sync();
  }

  onApplicationShutdown() {
    this.status = SyncStatus.TERMINATED;
  }

  /**
   * Will continuously look for new block until there is a critical error or is stopped.
   * It's run once when the app starts only.
   */
  private async sync(): Promise<void> {
    if (this.status !== SyncStatus.AWAITING_INITIALIZATION) {
      throw new Error('Watch has already been called');
    }

    this.status = SyncStatus.RUNNING;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - This is flagging an incorrect issue since its triggered by the onApplicationShutdown hook
    while (this.status !== SyncStatus.TERMINATED) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - This is flagging an incorrect issue since we are checking the status which can be changed via endpoint
      if (this.status === SyncStatus.STOPPING) {
        this.status = SyncStatus.STOPPED;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - This is flagging an incorrect issue
      if (this.status === SyncStatus.RUNNING) {
        try {
          await this.syncToLatestBlock();
        } catch (syncError) {
          this.logger.error(
            `SyncError: ${syncError.name}: ${syncError.message}`,
          );
        }
      }

      await sleep(this.config.SLEEP_INTERVAL);
    }

    this.logger.log('BlockMonitorService shutdown');
    return;
  }

  /**
   * Stop the block monitor. The sync loop will still run but not do anything.
   */
  public stop(): void {
    if (this.status !== SyncStatus.RUNNING) {
      throw new Error('Blockmonitor is already stopped or stopping');
    }

    this.logger.log('Stopping blockmonitor...');

    this.status = SyncStatus.STOPPING;
  }

  /**
   * Start the block monitor. The sync loop will still run but not do anything.
   */
  public start() {
    if (this.status !== SyncStatus.STOPPED) {
      throw new Error('Blockmonitor is not stopped');
    }

    this.logger.log('Starting blockmonitor...');

    this.status = SyncStatus.RUNNING;
  }

  /**
   * Sets the start block and indexes that block. The indexer will then begin indexing from that block.
   *
   * @param startBlock block to index from
   */
  public async setStartBlock(startBlock: number): Promise<void> {
    if (this.status !== SyncStatus.RUNNING) {
      throw new Error(
        `Can't set start block as current stage is not running. Status is: ${SyncStatus[this.status.toString()]}`,
      );
    }

    this.status = SyncStatus.FETCHING_START_BLOCK;

    const latestIndexedBlock = await this.getLatestIndexedBlock();

    if (latestIndexedBlock) {
      this.status = SyncStatus.RUNNING;
      throw new Error('Blockmonitor has already indexed blocks');
    }

    const blockRange = {
      fromBlock: startBlock,
      toBlock: startBlock,
    };

    const blockEvents = await this.getBlockEventsForBlockRange(blockRange);

    await this.blockProcessorService.processBlockEvents(blockEvents);

    // Reset status if we succeeded or if any issues occurred
    this.status = SyncStatus.RUNNING;
  }

  /**
   * Calculates how many blocks the BlockMonitor stack is behind the chain.
   *
   * @returns blocksElapsed, latestBlock and latestBlockProcessedNumber
   */
  public async getBlockProcessingDetails(): Promise<BlocksBehind> {
    const latestBlockProcessed = await this.getLatestIndexedBlock();

    const latestBlock = await this.client.headerByNumber();

    this.blockNumberGauge.set(latestBlock.number);

    // No previously stored block, so no blocks have elapsed
    if (!latestBlockProcessed) {
      return {
        blocksElapsed: -1,
        latestBlockProcessed: null,
        latestBlock,
      };
    }

    const latestBlockProcessedNumber = latestBlockProcessed.number;
    const blocksElapsed = latestBlock.number - latestBlockProcessedNumber;

    return { blocksElapsed, latestBlockProcessed, latestBlock };
  }

  private async updateDatabaseBlocks() {
    // Update the database with latest block and latest indexed block

    const { latestBlockProcessed, latestBlock } =
      await this.getBlockProcessingDetails();

    this.logger.log(
      `Updating database blocks. Latest block: ${latestBlock?.number}, latest indexed block: ${latestBlockProcessed?.number}`,
    );

    if (latestBlock) {
      await this.setLatestBlock(latestBlock);
    }
  }

  /**
   * Syncs our local state of the chain to the latest block found via Ethereum RPC
   */
  private async syncToLatestBlock() {
    const { blocksElapsed, latestBlockProcessed, latestBlock } =
      await this.getBlockProcessingDetails();

    // No block ever processed so start the block monitor from the start block
    if (!latestBlockProcessed) {
      let startBlock = this.configService.getStartBlock();

      if (startBlock === null) {
        startBlock = latestBlock?.number ?? 0;
      }

      await this.setStartBlock(startBlock);

      return;
    }

    if (blocksElapsed <= 0) {
      return;
    }

    try {
      let currentBlockNumber = latestBlockProcessed.number + 1;
      const endBlockNum = currentBlockNumber + blocksElapsed - 1;

      while (currentBlockNumber < endBlockNum) {
        const latestIndexedBlock = await this.getLatestIndexedBlock();

        if (!latestIndexedBlock) {
          throw new Error('No latest indexed block found');
        }

        // Check we haven't terminated during processing
        if (this.status !== SyncStatus.RUNNING) {
          return;
        }

        const blockRange = getNextBlockRange(
          currentBlockNumber,
          endBlockNum,
          this.config.MAX_BLOCKS_PER_QUERY,
        );

        await this.processBlockEventsInBlockRange(blockRange);

        currentBlockNumber = blockRange.toBlock + 1;

        await this.updateDatabaseBlocks();
      }
    } catch (err) {
      this.logger.error(`Syncing failed: ${err}, ${err.stack}`);

      await this.updateDatabaseBlocks();
    }
  }

  /**
   * Finds events that happened in a specific block range. It does this by comparing the last block
   * stored with the latest block discoverable via RPC.
   * If the stored block is older then the latest block, it batch fetches the events for missing
   * blocks, re-sets the stored blocks and returns the block events found
   *
   * @param blocksElapsed Difference between top block in stack and head of remote chain
   * @param latestRetainedBlockNumber top block in stack
   * @returns A list of Events (block events and whether they were removed/added)
   */
  private async processBlockEventsInBlockRange(blockRange: BlockRange) {
    const blockEvents = await this.getBlockEventsForBlockRange(blockRange);

    try {
      await this.blockProcessorService.processBlockEvents(blockEvents);
    } catch (err) {
      this.logger.error(`Error processing events: ${err.stack}`);
    }
  }

  /**
   * Fetches exhaustive set of block events in a range.
   *
   * @param blockRange block range to fetch events for.
   * @returns list of events in that block range.
   */
  private async getBlockEventsForBlockRange(
    blockRange: BlockRange,
  ): Promise<BlockEvent[]> {
    // batch fetches the block events without logs
    const blockEvents =
      await this.client.getLatestBlocksAndValidate(blockRange);

    const logs = await this.getLogsInBlockRange(blockRange);

    // During this step if we get any logs for block hashes that dont match the ones from the previous step throw so we can start whole cycle again
    const result = this.populateBlockEventsWithLogs(logs, blockEvents);

    return result;
  }

  /**
   * Given an array of logs and block events will add the logs to the correct block events
   * @param logs logs to add
   * @param blockEvents block events to add to
   * @returns block events with logs
   */
  private populateBlockEventsWithLogs(
    logs: Array<Log>,
    blockEvents: BlockEvent[],
  ): Array<BlockEvent> {
    // Create the block events from all the logs found by grouping them into blockHeaders
    const hashToBlockHeader: Map<string, BlockEvent> = new Map();

    for (const blockEvent of blockEvents) {
      hashToBlockHeader.set(blockEvent.hash, blockEvent);
    }

    for (const log of logs) {
      const blockHeader = hashToBlockHeader.get(log.blockHash);
      if (!blockHeader) {
        throw new Error(`No block event found for hash: ${log.blockHash}`);
      }

      blockHeader.logs.push(log);
    }

    return [...hashToBlockHeader.values()];
  }

  /**
   * Given a block range, gets all the logs in that block range.
   *
   * @returns logs and the furthest block processed
   */
  private async getLogsInBlockRange(
    blockRange: BlockRange,
  ): Promise<Array<Log>> {
    let logs: Array<Log> = [];

    this.logger.log(
      `Requesting for blocks ${blockRange.fromBlock} - ${blockRange.toBlock}`,
    );

    // TODO: Need to do the address filtering here too
    const topics = getTopicFiltersToSubscribe(
      this.configService.getEventTopicList(),
      blockRange.fromBlock,
      blockRange.toBlock,
    )
      .map((filter) => filter.topic)
      .sort();

    // TODO: Use enhancedFilterlogs
    logs = await this.client.filterLogs({
      ...blockRange,
      topics: [topics],
    });

    return logs;
  }

  get getStatus(): SyncStatus {
    return this.status;
  }

  get getConfig() {
    return this.config;
  }

  private async setLatestBlock(block: BlockEvent) {
    this.cacheDatabase.set(LATEST_BLOCK, block);
  }

  private async setLatestIndexedBlock(block: BlockEvent) {
    this.cacheDatabase.set(LATEST_INDEXED_BLOCK, block);
  }

  private async getLatestBlock(): Promise<BlockEvent | null> {
    const latestBlock = await this.cacheDatabase.get<BlockEvent>(LATEST_BLOCK);
    return latestBlock ?? null;
  }

  private async getLatestIndexedBlock(): Promise<BlockEvent | null> {
    const latestIndexedBlock =
      await this.cacheDatabase.get<BlockEvent>(LATEST_INDEXED_BLOCK);
    return latestIndexedBlock ?? null;
  }
}
