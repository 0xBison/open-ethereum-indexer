import {
  mineNewBlock,
  increaseBlockTime,
  setNextBlockTimestamp,
  getLatestBlock,
  getBlockNumber,
} from './node-functions';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to setup mock responses
function mockFetchResponse(responseData: any) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => responseData,
  });
}

describe('Blockchain Node Functions', () => {
  const TEST_RPC_URL = 'http://localhost:8545';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mineNewBlock should mine a new block', async () => {
    // Setup mock response
    mockFetchResponse({
      jsonrpc: '2.0',
      id: 1,
      result: '0x0',
    });

    const result = await mineNewBlock(TEST_RPC_URL);

    // Verify correct request was made
    expect(global.fetch).toHaveBeenCalledWith(
      TEST_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'evm_mine',
          params: [],
        }),
      }),
    );

    // Verify the result
    expect(result).toBe('0x0');
  });

  test('increaseBlockTime should increase blockchain time', async () => {
    // Setup mock response
    mockFetchResponse({
      jsonrpc: '2.0',
      id: 1,
      result: 1,
    });

    const result = await increaseBlockTime(TEST_RPC_URL, 1);

    // Verify correct request was made
    expect(global.fetch).toHaveBeenCalledWith(
      TEST_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'evm_increaseTime',
          params: [1],
        }),
      }),
    );

    // Verify the result
    expect(result).toBe(1);
  });

  test('setNextBlockTimestamp should set the timestamp for the next block', async () => {
    // Setup mock response
    mockFetchResponse({
      jsonrpc: '2.0',
      id: 1,
      result: null,
    });

    const timestamp = 1747088873;
    const result = await setNextBlockTimestamp(TEST_RPC_URL, timestamp);

    // Verify correct request was made
    expect(global.fetch).toHaveBeenCalledWith(
      TEST_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'evm_setNextBlockTimestamp',
          params: [timestamp],
        }),
      }),
    );

    // Verify the result
    expect(result).toBe(null);
  });

  test('getLatestBlock should return the latest block information', async () => {
    const mockBlockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        hash: '0x2674f9b11acc46cc7dd5580330006959dfae7004aab2d02b4cc8c693e3ad6ffa',
        parentHash:
          '0x8d7a072aa30fe614d2190f81cc44a35d81dfea561e953d29665ca00dcd688ac6',
        sha3Uncles:
          '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        miner: '0x0000000000000000000000000000000000000000',
        stateRoot:
          '0x9c8eaf493f8b4edce2ba1647343eadcc0989cf461e712c0a6253ff2ca1842bb7',
        transactionsRoot:
          '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        receiptsRoot:
          '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        logsBloom:
          '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        difficulty: '0x0',
        number: '0x8',
        gasLimit: '0x1c9c380',
        gasUsed: '0x0',
        timestamp: '0x67d276d3',
        extraData: '0x',
        mixHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: '0x0000000000000000',
        baseFeePerGas: '0x17681061',
        withdrawalsRoot:
          '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        blobGasUsed: '0x0',
        excessBlobGas: '0x0',
        parentBeaconBlockRoot:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        totalDifficulty: '0x0',
        size: '0x246',
        uncles: [],
        transactions: [],
        withdrawals: [],
      },
    };

    // Setup mock response
    mockFetchResponse(mockBlockResponse);

    const result = await getLatestBlock(TEST_RPC_URL);

    // Verify correct request was made
    expect(global.fetch).toHaveBeenCalledWith(
      TEST_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        }),
      }),
    );

    // Verify the result
    expect(result).toEqual(mockBlockResponse.result);
    expect(result.number).toBe('0x8');
    expect(result.hash).toBe(
      '0x2674f9b11acc46cc7dd5580330006959dfae7004aab2d02b4cc8c693e3ad6ffa',
    );
  });

  test('getBlockNumber should return the current block number', async () => {
    // Setup mock response
    mockFetchResponse({
      jsonrpc: '2.0',
      id: 1,
      result: '0x8',
    });

    const result = await getBlockNumber(TEST_RPC_URL);

    // Verify correct request was made
    expect(global.fetch).toHaveBeenCalledWith(
      TEST_RPC_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      }),
    );

    // Verify the result
    expect(result).toBe('0x8');
  });

  test('should handle JSON-RPC error responses', async () => {
    // Temporarily silence console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();

    try {
      // Setup mock error response
      mockFetchResponse({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      });

      // Try to call a function and expect it to throw
      await expect(mineNewBlock(TEST_RPC_URL)).rejects.toThrow(
        'JSON-RPC error: Method not found (code: -32601)',
      );
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });

  test('should handle HTTP errors', async () => {
    // Temporarily silence console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();

    try {
      // Setup mock HTTP error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Try to call a function and expect it to throw
      await expect(mineNewBlock(TEST_RPC_URL)).rejects.toThrow(
        'HTTP error! Status: 404',
      );
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });

  test('should handle network errors', async () => {
    // Temporarily silence console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();

    try {
      // Setup mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network failure'),
      );

      // Try to call a function and expect it to throw
      await expect(mineNewBlock(TEST_RPC_URL)).rejects.toThrow(
        'Network failure',
      );
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});
