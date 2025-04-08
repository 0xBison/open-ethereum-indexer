import { Controller, forwardRef, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BlockMonitorService,
  BlockMonitorServiceIdentifier,
} from './block-monitor.service';
import { BlocksBehind, SyncStatus } from '../types';
import { CoreConfig } from '../core.config';

@ApiTags('Indexer Administration')
@Controller()
export class BlockMonitorController {
  constructor(
    // No idea why forwardRef is required (it shouldnt be) but get a circular dependency error without it
    @Inject(forwardRef(() => BlockMonitorServiceIdentifier))
    private blockMonitorService: BlockMonitorService,
    private config: CoreConfig,
  ) {}

  /**
   * Fetch the configuration parameters of the BlockMonitor
   *
   * @returns the config parameters that the BlockMonitor was started with
   */
  @Get('/config')
  public async getConfig(): Promise<CoreConfig> {
    return this.blockMonitorService.getConfig;
  }

  /**
   * Get the latest processed block and the amount of blocks that have elapsed since that block according
   * to the chain.
   */
  @Get('/blockProcessingDetails')
  public async getBlockProcessingDetails(): Promise<BlocksBehind> {
    return this.blockMonitorService.getBlockProcessingDetails();
  }

  /**
   * Stops the BlockMonitor. The blockmonitor must be started for this to work.
   */
  @Get('/stop')
  public async stop(): Promise<void> {
    return this.blockMonitorService.stop();
  }

  /**
   * Starts the block monitor. The blockmonitor must be stopped for this to work.
   */
  @Get('/start')
  public async start(): Promise<void> {
    return this.blockMonitorService.start();
  }

  /**
   * Gets the current status of the blockMonitor.
   */
  @Get('/status')
  public async status(): Promise<SyncStatus> {
    return this.blockMonitorService.getStatus;
  }
}
