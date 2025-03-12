import { Test, TestingModule } from '@nestjs/testing';
import { Interface } from '@ethersproject/abi';
import {
  ConfigService,
  WILDCARD_ADDRESS,
  MAX_BLOCK_NUMBER,
} from './config.service';
import { Config } from './types';
import { mockFullAbi, mockTransferAbi } from './test/mock-abi';

describe('ConfigService', () => {
  let service: ConfigService;
  let transferTopic: string;
  let approvalTopic: string;
  let excludedTopic: string;

  beforeEach(() => {
    // Create interfaces to get topic hashes
    const interface1 = new Interface(mockFullAbi);
    transferTopic = interface1.getEventTopic('Transfer');
    approvalTopic = interface1.getEventTopic('Approval');
    excludedTopic = interface1.getEventTopic('ExcludedEvent');
  });

  describe('registerConfig', () => {
    it('should register events from contracts with addresses', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {
          TokenA: {
            abi: mockFullAbi,
            address: '0x1111111111111111111111111111111111111111',
            startBlock: 100,
            endBlock: 200,
            excludeEvents: ['ExcludedEvent'],
          },
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);
      const eventTopicList = service.getEventTopicList();

      // Check that Transfer and Approval events are registered
      expect(eventTopicList[transferTopic]).toBeDefined();
      expect(eventTopicList[approvalTopic]).toBeDefined();

      // Check that ExcludedEvent is not registered
      expect(eventTopicList[excludedTopic]).toBeUndefined();

      // Check event details
      expect(eventTopicList[transferTopic].eventName).toBe('Transfer');
      expect(eventTopicList[transferTopic].contractAddresses).toContain(
        '0x1111111111111111111111111111111111111111',
      );
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].startBlock,
      ).toBe(100);
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].endBlock,
      ).toBe(200);
    });

    it('should handle multiple contracts with the same event', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {
          TokenA: {
            abi: mockTransferAbi,
            address: '0x1111111111111111111111111111111111111111',
            startBlock: 100,
            endBlock: 200,
          },
          TokenB: {
            abi: mockTransferAbi,
            address: '0x2222222222222222222222222222222222222222',
            startBlock: 150,
            endBlock: 250,
          },
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);
      const eventTopicList = service.getEventTopicList();

      // Check that Transfer event is registered with both addresses
      expect(eventTopicList[transferTopic].contractAddresses).toContain(
        '0x1111111111111111111111111111111111111111',
      );
      expect(eventTopicList[transferTopic].contractAddresses).toContain(
        '0x2222222222222222222222222222222222222222',
      );

      // Check block ranges for each contract
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].startBlock,
      ).toBe(100);
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].endBlock,
      ).toBe(200);

      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x2222222222222222222222222222222222222222'
        ].startBlock,
      ).toBe(150);
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x2222222222222222222222222222222222222222'
        ].endBlock,
      ).toBe(250);
    });

    it('should handle contracts without specified block ranges', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {
          TokenA: {
            abi: mockTransferAbi,
            address: '0x1111111111111111111111111111111111111111',
            // No startBlock or endBlock specified
          },
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);
      const eventTopicList = service.getEventTopicList();

      // Check default block ranges
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].startBlock,
      ).toBe(0);
      expect(
        eventTopicList[transferTopic].contractBlockRanges[
          '0x1111111111111111111111111111111111111111'
        ].endBlock,
      ).toBe(MAX_BLOCK_NUMBER);
    });
  });

  describe('checkAddressMatches', () => {
    it('should return true when address matches', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      const addresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ];

      expect(
        service.checkAddressMatches(
          addresses,
          '0x1111111111111111111111111111111111111111',
        ),
      ).toBe(true);
      expect(
        service.checkAddressMatches(
          addresses,
          '0x2222222222222222222222222222222222222222',
        ),
      ).toBe(true);

      // Case insensitive
      expect(
        service.checkAddressMatches(
          addresses,
          '0x1111111111111111111111111111111111111111'.toUpperCase(),
        ),
      ).toBe(true);
    });

    it('should return false when address does not match', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      const addresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
      ];

      expect(
        service.checkAddressMatches(
          addresses,
          '0x3333333333333333333333333333333333333333',
        ),
      ).toBe(false);
    });

    it('should return true for any address when wildcard is present', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      const addresses = [
        '0x1111111111111111111111111111111111111111',
        WILDCARD_ADDRESS,
      ];

      expect(
        service.checkAddressMatches(
          addresses,
          '0x3333333333333333333333333333333333333333',
        ),
      ).toBe(true);
    });
  });

  describe('getEventDetails', () => {
    it('should return event details for a valid topic hash', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {
          TokenA: {
            abi: mockTransferAbi,
            address: '0x1111111111111111111111111111111111111111',
            startBlock: 100,
            endBlock: 200,
          },
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      const eventDetails = service.getEventDetails(transferTopic);
      expect(eventDetails).toBeDefined();
      expect(eventDetails?.eventName).toBe('Transfer');
      expect(eventDetails?.contractAddresses).toContain(
        '0x1111111111111111111111111111111111111111',
      );
    });

    it('should return null for an invalid topic hash', async () => {
      const config: Config = {
        network: {
          chainId: 1,
          rpcUrl: 'https://test.network',
        },
        contracts: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'CONFIG',
            useValue: config,
          },
          ConfigService,
        ],
      }).compile();

      service = module.get<ConfigService>(ConfigService);

      const invalidTopic =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      expect(service.getEventDetails(invalidTopic)).toBeNull();
    });
  });
});
