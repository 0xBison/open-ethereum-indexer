/**
 * Types for JSON-RPC responses
 */
type JsonRpcError = {
  code: number;
  message: string;
};

type JsonRpcResponse<T> = {
  jsonrpc: string;
  id: number;
} & (
  | {
      result: T;
      error?: never;
    }
  | {
      result?: never;
      error: JsonRpcError;
    }
);

/**
 * JSON-RPC request type
 */
type JsonRpcRequest = {
  jsonrpc: string;
  id: number;
  method: string;
  params: any[];
};

/**
 * Makes an RPC call to the specified blockchain node
 * @param rpcUrl The URL of the blockchain node
 * @param requestBody The JSON-RPC request body
 * @returns Promise with just the result field from the JSON-RPC response
 */
async function makeRpcCall<T>(
  rpcUrl: string,
  requestBody: JsonRpcRequest,
): Promise<T> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as JsonRpcResponse<T>;

    // Check if the response contains an error
    if (data.error) {
      throw new Error(
        `JSON-RPC error: ${data.error.message} (code: ${data.error.code})`,
      );
    }

    // Return just the result part of the response
    return data.result;
  } catch (error) {
    console.error('Error making RPC call:', error);
    throw error;
  }
}

/**
 * Mines a new block
 * @param rpcUrl The URL of the blockchain node
 * @returns Promise with the hash of the new block
 */
export async function mineNewBlock(rpcUrl: string): Promise<string> {
  const mineBlock: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'evm_mine',
    params: [],
  };

  return makeRpcCall<string>(rpcUrl, mineBlock);
}

/**
 * Increases blockchain time by a specified number of seconds
 * @param rpcUrl The URL of the blockchain node
 * @param seconds Number of seconds to increase time by (defaults to 86400 - 1 day)
 * @returns Promise with the new timestamp
 */
export async function increaseBlockTime(
  rpcUrl: string,
  seconds: number = 86400,
): Promise<number> {
  const customIncreaseTime: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'evm_increaseTime',
    params: [seconds],
  };
  return makeRpcCall<number>(rpcUrl, customIncreaseTime);
}

/**
 * Sets the timestamp for the next block
 * @param rpcUrl The URL of the blockchain node
 * @param timestamp Unix timestamp to set for the next block (defaults to 1744493755)
 * @returns Promise with null (operation has no meaningful return value)
 */
export async function setNextBlockTimestamp(
  rpcUrl: string,
  timestamp: number = 1744493755,
): Promise<null> {
  const customTimestamp: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'evm_setNextBlockTimestamp',
    params: [timestamp],
  };
  return makeRpcCall<null>(rpcUrl, customTimestamp);
}

/**
 * Sets a custom timestamp for the next block
 * @param rpcUrl The URL of the blockchain node
 * @param timestamp Unix timestamp to set for the next block
 * @returns Promise with null (operation has no meaningful return value)
 */
export async function setCustomNextBlockTimestamp(
  rpcUrl: string,
  timestamp: number,
): Promise<null> {
  const customTimestamp: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'evm_setNextBlockTimestamp',
    params: [timestamp],
  };
  return makeRpcCall<null>(rpcUrl, customTimestamp);
}

/**
 * Complete block information returned by the node
 */
type BlockInfo = {
  hash: string;
  parentHash: string;
  sha3Uncles: string;
  miner: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  logsBloom: string;
  difficulty: string;
  number: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  extraData: string;
  mixHash: string;
  nonce: string;
  baseFeePerGas: string;
  withdrawalsRoot: string;
  blobGasUsed: string;
  excessBlobGas: string;
  parentBeaconBlockRoot: string;
  totalDifficulty: string;
  size: string;
  uncles: string[];
  transactions: string[];
  withdrawals: any[];
};

/**
 * Gets the latest block from the blockchain node
 * @param rpcUrl The URL of the blockchain node
 * @returns Promise with the block information
 */
export async function getLatestBlock(rpcUrl: string): Promise<BlockInfo> {
  const latestBlock: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getBlockByNumber',
    params: ['latest', false],
  };
  return makeRpcCall<BlockInfo>(rpcUrl, latestBlock);
}

/**
 * Gets a specific block by number from the blockchain node
 * @param rpcUrl The URL of the blockchain node
 * @param blockNumber Block number to retrieve
 * @param transactionDetails Whether to include full transaction details
 * @returns Promise with the block information
 */
export async function getBlockByNumber(
  rpcUrl: string,
  blockNumber: number,
  transactionDetails: boolean = false,
): Promise<BlockInfo> {
  const blockHex = `0x${blockNumber.toString(16)}`;
  const blockNumberRequest: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getBlockByNumber',
    params: [blockHex, transactionDetails],
  };

  return makeRpcCall<BlockInfo>(rpcUrl, blockNumberRequest);
}

/**
 * Gets the current block number from the blockchain node
 * @param rpcUrl The URL of the blockchain node
 * @returns Promise with the current block number as a hex string
 */
export async function getBlockNumber(rpcUrl: string): Promise<string> {
  const blockNumberRequest: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_blockNumber',
    params: [],
  };

  return makeRpcCall<string>(rpcUrl, blockNumberRequest);
}
