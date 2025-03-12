import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { EthereumHttpClient, FilterLogs } from './ethereum-http-client';
import { of } from 'rxjs';
import BigNumber from 'bignumber.js';
import { Log } from '@ethersproject/abstract-provider';
import { AxiosHeaders } from 'axios';
import { ConfigService } from 'modules/config-module/config.service';

describe('EthereumHttpClient', () => {
  let service: EthereumHttpClient;
  let httpService: HttpService;

  // Mock data
  const mockRpcUrl = 'https://mock-eth-rpc.example.com';
  const mockChainId = 1;

  const mockLatestBlockHex = '0x100'; // 256 in decimal

  const mockBlocks = [
    {
      hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
      number: '0x64', // 100 in decimal
      parentHash:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: '0x60c869a0', // Some timestamp
      transactions: [],
    },
    {
      hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
      number: '0x65', // 101 in decimal
      parentHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      timestamp: '0x60c869b0', // Some timestamp
      transactions: [],
    },
    {
      hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
      number: '0x66', // 102 in decimal
      parentHash:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      timestamp: '0x60c869c0', // Some timestamp
      transactions: [],
    },
  ];

  const mockLogs: Log[] = [
    {
      blockNumber: 100,
      blockHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      transactionIndex: 0,
      removed: false,
      address: '0x1234567890123456789012345678901234567890',
      data: '0x1234',
      topics: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      ],
      transactionHash:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      logIndex: 0,
    },
    {
      blockNumber: 101,
      blockHash:
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      transactionIndex: 1,
      removed: false,
      address: '0x1234567890123456789012345678901234567890',
      data: '0x5678',
      topics: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      ],
      transactionHash:
        '0x0000000000000000000000000000000000000000000000000000000000000004',
      logIndex: 0,
    },
  ];

  beforeEach(async () => {
    // Create mock ConfigService
    const mockConfigService = {
      getConfig: jest.fn().mockReturnValue({
        network: {
          rpcUrl: mockRpcUrl,
          chainId: mockChainId,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        {
          provide: ConfigService, // Use the actual ConfigService class
          useValue: mockConfigService,
        },
        {
          provide: EthereumHttpClient,
          useFactory: (
            httpService: HttpService,
            configService: ConfigService,
          ) => {
            return new EthereumHttpClient(
              httpService,
              configService.getConfig().network.rpcUrl,
            );
          },
          inject: [HttpService, ConfigService],
        },
      ],
    }).compile();

    service = module.get<EthereumHttpClient>(EthereumHttpClient);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUrl', () => {
    it('should return the provider URL', () => {
      expect(service.getUrl()).toBe(mockRpcUrl);
    });
  });

  describe('getLatestBlock', () => {
    it('should fetch the latest block number', async () => {
      // Mock the HTTP response
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: mockLatestBlockHex,
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.getLatestBlock();

      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result).toBe(mockLatestBlockHex);
    });
  });

  describe('batchGetLatestBlocksWithoutLogs', () => {
    it('should fetch multiple blocks in a single request', async () => {
      // Mock the HTTP response
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: [
            {
              jsonrpc: '2.0',
              id: 1,
              result: mockBlocks[0],
            },
            {
              jsonrpc: '2.0',
              id: 2,
              result: mockBlocks[1],
            },
            {
              jsonrpc: '2.0',
              id: 3,
              result: mockBlocks[2],
            },
          ],
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.batchGetLatestBlocksWithoutLogs(100, 102);

      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: [
          {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['0x64', false],
            id: 1,
          },
          {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['0x65', false],
            id: 2,
          },
          {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['0x66', false],
            id: 3,
          },
        ],
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result).toEqual([
        {
          hash: mockBlocks[0].hash,
          number: parseInt(mockBlocks[0].number, 16),
          parent: mockBlocks[0].parentHash,
          timestamp: parseInt(mockBlocks[0].timestamp, 16),
          logs: [],
        },
        {
          hash: mockBlocks[1].hash,
          number: parseInt(mockBlocks[1].number, 16),
          parent: mockBlocks[1].parentHash,
          timestamp: parseInt(mockBlocks[1].timestamp, 16),
          logs: [],
        },
        {
          hash: mockBlocks[2].hash,
          number: parseInt(mockBlocks[2].number, 16),
          parent: mockBlocks[2].parentHash,
          timestamp: parseInt(mockBlocks[2].timestamp, 16),
          logs: [],
        },
      ]);
    });
  });

  describe('getLatestBlocksAndValidate', () => {
    it('should fetch and validate a range of blocks', async () => {
      const blockRange = { fromBlock: 100, toBlock: 102 };

      // Mock the batchGetLatestBlocksWithoutLogs method
      jest
        .spyOn(service, 'batchGetLatestBlocksWithoutLogs')
        .mockResolvedValueOnce([
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            number: 100,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: parseInt('0x60c869a0', 16),
            logs: [],
          },
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            number: 101,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            timestamp: parseInt('0x60c869b0', 16),
            logs: [],
          },
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
            number: 102,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000002',
            timestamp: parseInt('0x60c869c0', 16),
            logs: [],
          },
        ]);

      const result = await service.getLatestBlocksAndValidate(blockRange);

      expect(service.batchGetLatestBlocksWithoutLogs).toHaveBeenCalledWith(
        100,
        102,
      );

      expect(result.length).toBe(3);
    });

    it('should throw an error if parent hashes do not match', async () => {
      const blockRange = { fromBlock: 100, toBlock: 102 };

      // Mock with incorrect parent hash
      jest
        .spyOn(service, 'batchGetLatestBlocksWithoutLogs')
        .mockResolvedValueOnce([
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            number: 100,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: parseInt('0x60c869a0', 16),
            logs: [],
          },
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            number: 101,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000003', // Incorrect parent hash
            timestamp: parseInt('0x60c869b0', 16),
            logs: [],
          },
          {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
            number: 102,
            parent:
              '0x0000000000000000000000000000000000000000000000000000000000000002',
            timestamp: parseInt('0x60c869c0', 16),
            logs: [],
          },
        ]);

      await expect(
        service.getLatestBlocksAndValidate(blockRange),
      ).rejects.toThrow(
        'Expected parent hash to be 0x0000000000000000000000000000000000000000000000000000000000000001 but it was 0x0000000000000000000000000000000000000000000000000000000000000003',
      );
    });
  });

  describe('headerByNumber', () => {
    it('should fetch a block by number', async () => {
      // Mock the HTTP response for getBlockDirect
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: {
              hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
              parentHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              number: '0x64', // 100 in hex
              timestamp: '0x60c869a0',
              transactions: [],
            },
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.headerByNumber(new BigNumber(100));

      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: {
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['0x64', false],
          id: 1,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result).toEqual({
        hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        parent:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        number: 100,
        timestamp: parseInt('0x60c869a0', 16),
        logs: [],
      });
    });

    it('should fetch the latest block when no number is provided', async () => {
      // Mock the HTTP response for getBlockDirect
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: {
              hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
              parentHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              number: '0x64', // 100 in hex
              timestamp: '0x60c869a0',
              transactions: [],
            },
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.headerByNumber();

      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: {
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
          id: 1,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result).toEqual({
        hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        parent:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        number: 100,
        timestamp: parseInt('0x60c869a0', 16),
        logs: [],
      });
    });

    it('should throw an error if the block is not found', async () => {
      // Mock the HTTP response for getBlockDirect with null result
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: null,
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      await expect(service.headerByNumber(new BigNumber(999))).rejects.toThrow(
        'unknown block: 999',
      );
    });
  });

  describe('headerByHash', () => {
    it('should fetch a block by hash', async () => {
      const blockHash =
        '0x0000000000000000000000000000000000000000000000000000000000000001';

      // Mock the HTTP response for getBlockDirect
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: {
              hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
              parentHash:
                '0x0000000000000000000000000000000000000000000000000000000000000000',
              number: '0x64', // 100 in hex
              timestamp: '0x60c869a0',
              transactions: [],
            },
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.headerByHash(blockHash);

      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: {
          jsonrpc: '2.0',
          method: 'eth_getBlockByHash',
          params: [blockHash, false],
          id: 1,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result).toEqual({
        hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        parent:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        number: 100,
        timestamp: parseInt('0x60c869a0', 16),
        logs: [],
      });
    });

    it('should throw an error if the block is not found', async () => {
      const blockHash = '0xnonexistentblockhash';

      // Mock the HTTP response for getBlockDirect with null result
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: null,
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      await expect(service.headerByHash(blockHash)).rejects.toThrow(
        'unknown block: 0xnonexistentblockhash',
      );
    });
  });

  describe('filterLogs', () => {
    it('should fetch logs based on filter criteria', async () => {
      const filter: FilterLogs = {
        fromBlock: 100,
        toBlock: 102,
        topics: [
          [
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
        ],
      };

      // Mock the HTTP response
      jest.spyOn(httpService, 'request').mockReturnValueOnce(
        of({
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: mockLogs,
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
            url: mockRpcUrl,
            method: 'post',
          },
        }),
      );

      const result = await service.filterLogs(filter);

      // Update the expectation to match the exact order of properties in the actual call
      expect(httpService.request).toHaveBeenCalledWith({
        url: mockRpcUrl,
        method: 'post',
        data: {
          jsonrpc: '2.0',
          method: 'eth_getLogs',
          params: [
            {
              fromBlock: '0x64',
              toBlock: '0x66',
              topics: [
                [
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                ],
              ],
            },
          ],
          id: 1,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      // The formatter will process the logs, but we're mocking that behavior
      expect(result.length).toBe(2);
    });
  });
});
