import { Test, TestingModule } from '@nestjs/testing';
import { BlockMonitorService } from './block-monitor.service';
import {
  EthereumHttpClient,
  EthereumHttpClientProviderIdentifier,
} from '../../ethereum-client-module/ethereum-http-client';
import {
  BlockProcessorService,
  BlockProcessorServiceIdentifier,
} from '../block-processor/block-processor';
import { CoreConfig } from '../core.config';
import { ConfigService } from '../../config-module/config.service';
import { JsonStore, JsonStoreIdentifier } from 'nest-json-store';
import { SyncStatus } from '../types';
import { LATEST_INDEXED_BLOCK } from './constants';

// Mock the getNextBlockRange utility
jest.mock('../utils/get-next-block-range', () => ({
  getNextBlockRange: jest.fn().mockImplementation((from, to, max) => {
    return { fromBlock: from, toBlock: Math.min(from + max - 1, to) };
  }),
}));

describe('BlockMonitorService', () => {
  let service: BlockMonitorService;
  let mockEthereumHttpClient: Partial<EthereumHttpClient>;
  let mockBlockProcessorService: Partial<BlockProcessorService>;
  let mockCoreConfig: Partial<CoreConfig>;
  let mockConfigService: Partial<ConfigService>;
  let mockJsonStore: Partial<JsonStore>;
  let mockHistogram: any;

  const mockBlockEvent = {
    hash: '0x123',
    number: 100,
    logs: [],
    parentHash: '0x000',
    timestamp: 1234567890,
  };

  const mockLatestBlock = {
    hash: '0x456',
    number: 105,
    logs: [],
    parentHash: '0x123',
    timestamp: 1234567899,
  };

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Create basic mocks
    mockEthereumHttpClient = {
      headerByNumber: jest.fn().mockResolvedValue(mockLatestBlock),
      getLatestBlocksAndValidate: jest.fn().mockResolvedValue([mockBlockEvent]),
      filterLogs: jest.fn().mockResolvedValue([]),
    };

    mockBlockProcessorService = {
      processBlockEvents: jest.fn().mockResolvedValue(undefined),
    };

    mockCoreConfig = {
      SLEEP_INTERVAL: 1000,
      MAX_BLOCKS_PER_QUERY: 10,
    };

    mockConfigService = {
      getStartBlock: jest.fn().mockReturnValue(100),
      getEventTopicList: jest.fn().mockReturnValue([]),
    };

    mockJsonStore = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockHistogram = {
      observe: jest.fn(),
    };

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockMonitorService,
        {
          provide: EthereumHttpClientProviderIdentifier,
          useValue: mockEthereumHttpClient,
        },
        {
          provide: BlockProcessorServiceIdentifier,
          useValue: mockBlockProcessorService,
        },
        {
          provide: JsonStoreIdentifier,
          useValue: mockJsonStore,
        },
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'PROM_METRIC_LOGS_COUNT_PER_BLOCK_RANGE',
          useValue: mockHistogram,
        },
      ],
    })
      .overrideProvider('PROM_METRIC_LOGS_COUNT_PER_BLOCK_RANGE')
      .useValue(mockHistogram)
      .compile();

    service = module.get<BlockMonitorService>(BlockMonitorService);

    // Prevent sync method from running
    jest
      .spyOn(service as any, 'sync')
      .mockImplementation(() => Promise.resolve());
  });

  describe('start', () => {
    it('should start the block monitor when stopped', () => {
      (service as any).status = SyncStatus.STOPPED;

      service.start();

      expect((service as any).status).toBe(SyncStatus.RUNNING);
    });

    it('should throw an error if not stopped', () => {
      (service as any).status = SyncStatus.RUNNING;

      expect(() => service.start()).toThrow('Blockmonitor is not stopped');
    });
  });

  describe('stop', () => {
    it('should stop the block monitor when running', () => {
      (service as any).status = SyncStatus.RUNNING;

      service.stop();

      expect((service as any).status).toBe(SyncStatus.STOPPING);
    });

    it('should throw an error if not running', () => {
      (service as any).status = SyncStatus.STOPPED;

      expect(() => service.stop()).toThrow(
        'Blockmonitor is already stopped or stopping',
      );
    });
  });

  describe('setStartBlock', () => {
    it('should set the start block and index it', async () => {
      (service as any).status = SyncStatus.RUNNING;
      mockJsonStore.get = jest.fn().mockResolvedValue(null);

      await service.setStartBlock(100);

      expect(
        mockEthereumHttpClient.getLatestBlocksAndValidate,
      ).toHaveBeenCalledWith({
        fromBlock: 100,
        toBlock: 100,
      });
      expect(mockBlockProcessorService.processBlockEvents).toHaveBeenCalled();
      expect(mockJsonStore.set).toHaveBeenCalledWith(
        LATEST_INDEXED_BLOCK,
        mockBlockEvent,
      );
      expect((service as any).status).toBe(SyncStatus.RUNNING);
    });

    it('should throw an error if the block monitor is not running', async () => {
      (service as any).status = SyncStatus.STOPPED;

      await expect(service.setStartBlock(100)).rejects.toThrow(
        "Can't set start block as current stage is not running. Status is: STOPPED",
      );
    });

    it('should throw an error if blocks are already indexed', async () => {
      (service as any).status = SyncStatus.RUNNING;
      mockJsonStore.get = jest.fn().mockResolvedValue(mockBlockEvent);

      await expect(service.setStartBlock(100)).rejects.toThrow(
        'Blockmonitor has already indexed blocks',
      );
      expect((service as any).status).toBe(SyncStatus.RUNNING);
    });
  });

  describe('getBlockProcessingDetails', () => {
    it('should return -1 and null values when no block has been indexed', async () => {
      mockJsonStore.get = jest.fn().mockResolvedValue(null);

      const result = await service.getBlockProcessingDetails();

      expect(result).toEqual({
        blocksElapsed: -1,
        latestBlockProcessed: null,
        latestBlock: mockLatestBlock,
      });
    });

    it('should return the correct blocks behind count', async () => {
      mockJsonStore.get = jest.fn().mockImplementation((key) => {
        if (key === LATEST_INDEXED_BLOCK) return mockBlockEvent;
        return null;
      });

      const result = await service.getBlockProcessingDetails();

      expect(result).toEqual({
        blocksElapsed: mockLatestBlock.number - mockBlockEvent.number,
        latestBlockProcessed: mockBlockEvent,
        latestBlock: mockLatestBlock,
      });
    });
  });

  describe('onModuleInit', () => {
    it('should call sync method', () => {
      const syncSpy = jest.spyOn(service as any, 'sync');

      service.onModuleInit();

      expect(syncSpy).toHaveBeenCalled();
    });
  });
});
