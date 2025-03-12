import { Test, TestingModule } from '@nestjs/testing';
import {
  EventManagerService,
  EVENT_MANAGER_SERVICE,
} from './event-manager.service';
import { LogEvent } from './types';
import { ConfigService } from 'modules/config-module';

// Create contract addresses for testing
const CONTRACT_ADDRESSES = {
  Uniswap: '0xUniswapAddress',
  TokenA: '0xTokenAAddress',
  TokenB: '0xTokenBAddress',
  Any: '0xAnyAddress',
  Other: '0xOtherAddress',
  Sushi: '0xSushiAddress',
};

// Create a mock ConfigService with our test contracts
const mockConfigService = {
  getConfig: jest.fn().mockReturnValue({
    contracts: {
      Uniswap: { address: CONTRACT_ADDRESSES.Uniswap },
      TokenA: { address: CONTRACT_ADDRESSES.TokenA },
      TokenB: { address: CONTRACT_ADDRESSES.TokenB },
      Any: { address: CONTRACT_ADDRESSES.Any },
      Other: { address: CONTRACT_ADDRESSES.Other },
      Sushi: { address: CONTRACT_ADDRESSES.Sushi },
    },
  }),
};

describe('EventManagerService', () => {
  let service: EventManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EVENT_MANAGER_SERVICE,
          useClass: EventManagerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EventManagerService>(EVENT_MANAGER_SERVICE);
  });

  describe('Block handlers', () => {
    it('should execute block index handlers in order', async () => {
      const results: number[] = [];

      service.onBlock({
        onIndex: async () => {
          results.push(1);
        },
      });

      service.onBlock({
        onIndex: async () => {
          results.push(2);
        },
      });

      await service.emitBlockIndex({});
      expect(results).toEqual([1, 2]);
    });

    it('should execute block deindex handlers in order', async () => {
      const results: number[] = [];

      service.onBlock({
        onDeindex: async () => {
          results.push(1);
        },
      });

      service.onBlock({
        onDeindex: async () => {
          results.push(2);
        },
      });

      await service.emitBlockDeindex({});
      expect(results).toEqual([1, 2]);
    });

    it('should maintain order with mixed handlers', async () => {
      const results: string[] = [];

      service.onBlock({
        onIndex: async () => {
          results.push('index1');
        },
        onDeindex: async () => {
          results.push('deindex1');
        },
      });

      service.onBlock({
        onIndex: async () => {
          results.push('index2');
        },
      });

      service.onBlock({
        onDeindex: async () => {
          results.push('deindex3');
        },
      });

      await service.emitBlockIndex({});
      await service.emitBlockDeindex({});

      expect(results).toEqual(['index1', 'index2', 'deindex1', 'deindex3']);
    });
  });

  describe('Event handlers', () => {
    it('should execute event handlers in order', async () => {
      const results: number[] = [];

      service.onEvent('*:*', {
        onIndex: async () => {
          results.push(1);
        },
      });

      service.onEvent('*:*', {
        onIndex: async () => {
          results.push(2);
        },
      });

      await service.emitEventIndex(createMockLogEvent('Any', 'Event'));
      expect(results).toEqual([1, 2]);
    });

    it('should match exact patterns', async () => {
      const results: string[] = [];

      service.onEvent('Uniswap:Trade', {
        onIndex: async () => {
          results.push('exact');
        },
      });

      await service.emitEventIndex(createMockLogEvent('Uniswap', 'Trade'));
      await service.emitEventIndex(createMockLogEvent('Other', 'Trade'));

      expect(results).toEqual(['exact']);
    });

    it('should match wildcard patterns', async () => {
      const results: string[] = [];

      service.onEvent('*:Transfer', {
        onIndex: async () => {
          results.push('wildcard');
        },
      });

      await service.emitEventIndex(createMockLogEvent('TokenA', 'Transfer'));
      await service.emitEventIndex(createMockLogEvent('TokenB', 'Transfer'));
      await service.emitEventIndex(createMockLogEvent('TokenA', 'Other'));

      expect(results).toEqual(['wildcard', 'wildcard']);
    });

    it('should match contract wildcard patterns', async () => {
      const results: string[] = [];

      service.onEvent('Uniswap:*', {
        onIndex: async () => {
          results.push('contract');
        },
      });

      await service.emitEventIndex(createMockLogEvent('Uniswap', 'Trade'));
      await service.emitEventIndex(createMockLogEvent('Uniswap', 'Swap'));
      await service.emitEventIndex(createMockLogEvent('Other', 'Trade'));

      expect(results).toEqual(['contract', 'contract']);
    });

    it('should match global wildcard pattern', async () => {
      const results: string[] = [];

      service.onEvent('*:*', {
        onIndex: async () => {
          results.push('global');
        },
      });

      await service.emitEventIndex(createMockLogEvent('Any', 'Event'));
      await service.emitEventIndex(createMockLogEvent('Other', 'Thing'));

      expect(results).toEqual(['global', 'global']);
    });

    it('should maintain order with mixed handlers and patterns', async () => {
      const results: string[] = [];

      service.onEvent('*:*', {
        onIndex: async () => {
          results.push('global1');
        },
        onDeindex: async () => {
          results.push('globalDe1');
        },
      });

      service.onEvent('Uniswap:*', {
        onIndex: async () => {
          results.push('uni2');
        },
      });

      service.onEvent('*:Transfer', {
        onDeindex: async () => {
          results.push('transferDe3');
        },
      });

      await service.emitEventIndex(createMockLogEvent('Uniswap', 'Trade'));
      await service.emitEventDeindex(createMockLogEvent('TokenA', 'Transfer'));

      expect(results).toEqual(['global1', 'uni2', 'globalDe1', 'transferDe3']);
    });
  });
});

// Helper function to create mock LogEvent objects
function createMockLogEvent(contractName: string, eventName: string): LogEvent {
  return {
    log: {
      address: CONTRACT_ADDRESSES[contractName], // Use the predefined address
      blockTimestamp: Math.floor(Date.now() / 1000),
      blockNumber: 123456,
      blockHash: '0xblockhash',
      transactionIndex: 0,
      removed: false,
      transactionHash: '0xtxhash',
      logIndex: 0,
      data: '0x',
      topics: ['0xtopic'],
    },
    parsedEvent: {
      name: eventName,
      signature: `${eventName}()`,
      topic: '0xtopic',
      args: [],
      eventFragment: {
        name: eventName,
        inputs: [],
        anonymous: false,
        type: 'event',
        _isFragment: true,
        format: (format: string) => format,
      },
    },
  };
}
