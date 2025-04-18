import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { BlockEvent } from '../types';
import { Formatter } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';
import { Log } from '@ethersproject/abstract-provider';
import { TopicList } from '../config-module/types';
import { WILDCARD_ADDRESS } from '../config-module/config.service';

export interface FilterLogs {
  fromBlock: number;
  toBlock: number;
  topics: Array<string | Array<string>>;
  addresses?: string[];
}

export const EthereumHttpClientProviderIdentifier =
  'EthereumHttpClientProvider';

@Injectable()
export class EthereumHttpClient {
  private formatter: Formatter;
  private readonly logger = new Logger(EthereumHttpClient.name);

  constructor(
    protected httpService: HttpService,
    private rpcUrl: string,
  ) {
    this.logger.log(
      `Initializing Ethereum HTTP client with RPC URL: ${rpcUrl}`,
    );
    this.formatter = new Formatter();
  }

  /**
   * Get the latest block number from the chain
   *
   * @returns the latest block number in hex
   */
  async getLatestBlock(): Promise<string> {
    this.logger.debug('Fetching latest block number');

    const getLatestBlockRequest = {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    };

    const responseObservable = this.httpService.request({
      url: this.rpcUrl,
      method: 'post',
      data: getLatestBlockRequest,
      headers: { 'Content-Type': 'application/json' },
    });
    const { data } = (await lastValueFrom(responseObservable)) as any;

    this.logger.debug(`Received latest block number: ${data.result}`);
    return data.result;
  }

  /**
   * Given a block range, will fetch the block events for that range in a single rpc call. Doesn't
   * include logs.
   *
   * @param fromBlock block to fetch from
   * @param toBlock block to fetch to
   * @returns array of BlockEvents without logs
   */
  async batchGetLatestBlocksWithoutLogs(
    fromBlock: number,
    toBlock: number,
  ): Promise<BlockEvent[]> {
    this.logger.debug(`Batch fetching blocks from ${fromBlock} to ${toBlock}`);

    const x = toBlock - fromBlock + 1;

    const blocksArray = Array(x)
      .fill(fromBlock)
      .map((number, index) => {
        const blockNumberDec = number + index;
        const blockNumberHex = Number(blockNumberDec).toString(16);

        return {
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumberHex}`, false],
          id: index + 1,
        };
      });
    const responseObservable = this.httpService.request({
      url: this.rpcUrl,
      method: 'post',
      data: blocksArray,
      headers: { 'Content-Type': 'application/json' },
    });
    const { data } = (await lastValueFrom(responseObservable)) as any;

    const blockEvents: BlockEvent[] = data.map(
      (getBlockResponse: any): BlockEvent => {
        const { result } = getBlockResponse;
        return {
          hash: result.hash,
          parent: result.parentHash,
          number: parseInt(result.number, 16),
          timestamp: parseInt(result.timestamp, 16),
          logs: [],
        };
      },
    );

    this.logger.debug(
      `Retrieved ${blockEvents.length} blocks in batch operation`,
    );
    return blockEvents;
  }

  /**
   * Fetches a block by its number or hash using eth HTTP RPC call
   * @param blockHashOrNumber - Block hash or number (or 'latest')
   * @returns Block data
   */
  async getBlock(blockHashOrNumber: string | number): Promise<any> {
    this.logger.debug(
      `Fetching block by ${typeof blockHashOrNumber === 'number' ? 'number' : 'hash'}: ${blockHashOrNumber}`,
    );

    const method =
      typeof blockHashOrNumber === 'string' &&
      blockHashOrNumber.startsWith('0x') &&
      blockHashOrNumber !== 'latest'
        ? 'eth_getBlockByHash'
        : 'eth_getBlockByNumber';

    // Convert number to hex if needed
    const blockParam =
      typeof blockHashOrNumber === 'number'
        ? `0x${blockHashOrNumber.toString(16)}`
        : blockHashOrNumber;

    const getBlockRequest = {
      jsonrpc: '2.0',
      method: method,
      params: [blockParam, false], // false = don't include full transaction objects
      id: 1,
    };

    const responseObservable = this.httpService.request({
      url: this.rpcUrl,
      method: 'post',
      data: getBlockRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    const { data } = (await lastValueFrom(responseObservable)) as any;

    if (!data.result) {
      throw new Error(
        blockParam !== 'latest'
          ? `unknown block: ${blockHashOrNumber}`
          : 'failed to fetch the latest block',
      );
    }

    this.logger.debug(
      `Retrieved block ${data.result.hash} (number: ${data.result.number})`,
    );
    return {
      hash: data.result.hash,
      parentHash: data.result.parentHash,
      number: parseInt(data.result.number, 16),
      timestamp: parseInt(data.result.timestamp, 16),
    };
  }

  /**
   * Fetches a block header by number
   * @param number - Block number (or undefined for latest)
   * @returns BlockEvent
   */
  async headerByNumber(number?: BigNumber): Promise<BlockEvent> {
    const blockParam = number ? number.toNumber() : 'latest';
    this.logger.debug(`Fetching block header by number: ${blockParam}`);

    const blockData = await this.getBlock(blockParam);

    const blockEvent: BlockEvent = {
      hash: blockData.hash,
      parent: blockData.parentHash,
      number: blockData.number,
      timestamp: blockData.timestamp,
      logs: [],
    };

    this.logger.debug(
      `Retrieved header for block ${blockEvent.hash} (number: ${blockEvent.number})`,
    );
    return blockEvent;
  }

  /**
   * Fetches a block header by hash
   * @param hash - Block hash
   * @returns BlockEvent
   */
  async headerByHash(hash: string): Promise<BlockEvent> {
    this.logger.debug(`Fetching block header by hash: ${hash}`);

    const blockData = await this.getBlock(hash);

    const blockEvent: BlockEvent = {
      hash: blockData.hash,
      parent: blockData.parentHash,
      number: blockData.number,
      timestamp: blockData.timestamp,
      logs: [],
    };

    this.logger.debug(
      `Retrieved header for block ${blockEvent.hash} (number: ${blockEvent.number})`,
    );
    return blockEvent;
  }

  /**
   * Fetches and validates a range of blocks
   * @param blockRange - Range of blocks to fetch
   * @returns Array of BlockEvents
   */
  async getLatestBlocksAndValidate(blockRange: {
    fromBlock: number;
    toBlock: number;
  }): Promise<BlockEvent[]> {
    this.logger.debug(
      `Fetching and validating blocks from ${blockRange.fromBlock} to ${blockRange.toBlock}`,
    );

    const { fromBlock, toBlock } = blockRange;

    const blocks = await this.batchGetLatestBlocksWithoutLogs(
      fromBlock,
      toBlock,
    );

    // Validate that the blocks form a chain
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      if (currentBlock.parent !== previousBlock.hash) {
        throw new Error(
          `Expected parent hash to be ${previousBlock.hash} but it was ${currentBlock.parent}`,
        );
      }
    }

    this.logger.debug(
      `Successfully validated chain of ${blocks.length} blocks`,
    );
    return blocks;
  }

  /**
   * Fetches logs based on filter criteria
   * @param filter - Filter criteria
   * @returns Array of logs
   */
  async filterLogs(filter: FilterLogs): Promise<Array<Log>> {
    this.logger.debug(
      `Fetching logs from block ${filter.fromBlock} to ${filter.toBlock} with ${filter.topics.length} topic filters`,
    );
    if (filter.addresses) {
      this.logger.debug(`Filtering by ${filter.addresses.length} addresses`);
    }

    const { fromBlock, toBlock, topics } = filter;

    const fromBlockHex = `0x${fromBlock.toString(16)}`;
    const toBlockHex = `0x${toBlock.toString(16)}`;

    const getLogsRequest = {
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: fromBlockHex,
          toBlock: toBlockHex,
          topics,
        },
      ],
      id: 1,
    };

    const responseObservable = this.httpService.request({
      url: this.rpcUrl,
      method: 'post',
      data: getLogsRequest,
      headers: { 'Content-Type': 'application/json' },
    });
    const { data } = (await lastValueFrom(responseObservable)) as any;

    const logs = <Array<Log>>data.result;

    // Use the ethers formatter to convert hex values in response to decimals
    const formattedResult = Formatter.arrayOf(
      this.formatter.filterLog.bind(this.formatter),
    )(logs);

    this.logger.debug(
      `Retrieved ${formattedResult.length} logs matching filter criteria`,
    );
    return formattedResult;
  }

  /**
   * Gets topic filters that are relevant for a specific block range with their valid ranges
   *
   * @param eventTopicList The event topic list from config
   * @param blockRange The block range to fetch logs for
   * @returns Array of topic filters with their valid block ranges
   */
  getRelevantTopicFilters(
    eventTopicList: TopicList,
    blockRange: { fromBlock: number; toBlock: number },
  ): Array<{
    topic: string;
    addresses?: string[];
    validRange: { startBlock: number; endBlock: number };
  }> {
    this.logger.debug(
      `Finding relevant topic filters for blocks ${blockRange.fromBlock} to ${blockRange.toBlock}`,
    );

    const topicFilters: Array<{
      topic: string;
      addresses?: string[];
      validRange: { startBlock: number; endBlock: number };
    }> = [];

    const processedTopics = new Set<string>();

    for (const [topicHash, eventInfo] of Object.entries(eventTopicList)) {
      if (processedTopics.has(topicHash)) continue;
      processedTopics.add(topicHash);

      // Find all addresses that have this event active in the block range
      const activeAddresses: string[] = [];
      let minStartBlock = Number.MAX_SAFE_INTEGER;
      let maxEndBlock = 0;
      let isActive = false;

      // Check if wildcard address is active
      const hasWildcard =
        eventInfo.contractAddresses.includes(WILDCARD_ADDRESS);
      let wildcardActive = false;

      if (hasWildcard) {
        const range = eventInfo.contractBlockRanges[WILDCARD_ADDRESS];
        if (
          range.startBlock <= blockRange.toBlock &&
          range.endBlock >= blockRange.fromBlock
        ) {
          wildcardActive = true;
          isActive = true;

          // Update min/max blocks for this topic
          minStartBlock = Math.min(minStartBlock, range.startBlock);
          maxEndBlock = Math.max(maxEndBlock, range.endBlock);
        }
      }

      // Check specific addresses
      for (const address of eventInfo.contractAddresses) {
        if (address === WILDCARD_ADDRESS) continue;

        const range = eventInfo.contractBlockRanges[address];

        // Check if block range overlaps with our query range
        if (
          range.startBlock <= blockRange.toBlock &&
          range.endBlock >= blockRange.fromBlock
        ) {
          activeAddresses.push(address);
          isActive = true;

          // Update min/max blocks for this topic
          minStartBlock = Math.min(minStartBlock, range.startBlock);
          maxEndBlock = Math.max(maxEndBlock, range.endBlock);
        }
      }

      if (isActive) {
        // Calculate the effective range for this topic
        const effectiveRange = {
          startBlock: Math.max(minStartBlock, blockRange.fromBlock),
          endBlock: Math.min(maxEndBlock, blockRange.toBlock),
        };

        const filter: {
          topic: string;
          addresses?: string[];
          validRange: { startBlock: number; endBlock: number };
        } = {
          topic: topicHash,
          validRange: effectiveRange,
        };

        // Only add addresses if we don't have a wildcard and we have specific addresses
        if (!wildcardActive && activeAddresses.length > 0) {
          filter.addresses = activeAddresses;
        }

        topicFilters.push(filter);
      }
    }

    this.logger.debug(
      `Found ${topicFilters.length} relevant topic filters for block range`,
    );
    return topicFilters;
  }

  /**
   * Enhanced version of filterLogs that handles filtering logs based on contract-specific block ranges
   *
   * @param blockRange The overall block range to query
   * @param topicFilters Array of topic filters with their valid block ranges
   * @returns Filtered array of logs that match the specified criteria
   */
  async enhancedFilterLogs(
    blockRange: { fromBlock: number; toBlock: number },
    topicFilters: Array<{
      topic: string;
      addresses?: string[];
      validRange: { startBlock: number; endBlock: number };
    }>,
  ): Promise<Array<Log>> {
    this.logger.debug(
      `Enhanced filter logs for blocks ${blockRange.fromBlock} to ${blockRange.toBlock} with ${topicFilters.length} filters`,
    );

    // If no topic filters, return empty array
    if (topicFilters.length === 0) {
      return [];
    }

    // Extract all topics for the main query
    const allTopics = topicFilters.map((filter) => filter.topic);

    // Collect all addresses that need filtering
    const addressesSet = new Set<string>();
    let needAddressFiltering = false;

    topicFilters.forEach((filter) => {
      if (filter.addresses && filter.addresses.length > 0) {
        needAddressFiltering = true;
        filter.addresses.forEach((addr) =>
          addressesSet.add(addr.toLowerCase()),
        );
      }
    });

    // Convert to array if needed
    const addresses = needAddressFiltering
      ? Array.from(addressesSet)
      : undefined;

    // Get all logs for the block range
    const logs = await this.filterLogs({
      ...blockRange,
      topics: [allTopics],
      ...(addresses && { addresses }),
    });

    // Filter logs based on topic-specific block ranges
    const filteredLogs = logs.filter((log) => {
      // Find the matching topic filter
      const matchingFilter = topicFilters.find(
        (filter) =>
          filter.topic === log.topics[0] &&
          log.blockNumber >= filter.validRange.startBlock &&
          log.blockNumber <= filter.validRange.endBlock,
      );

      if (!matchingFilter) return false;

      // If addresses are specified in the filter, check if the log address matches
      if (matchingFilter.addresses && matchingFilter.addresses.length > 0) {
        return matchingFilter.addresses.some(
          (addr) => addr.toLowerCase() === log.address.toLowerCase(),
        );
      }

      return true;
    });

    this.logger.debug(
      `Filtered to ${filteredLogs.length} logs after initial query`,
    );

    this.logger.debug(
      `Returned ${filteredLogs.length} logs after additional filtering`,
    );
    return filteredLogs;
  }

  /**
   * Fetches logs for a block range, filtering by relevant topics and their valid ranges
   *
   * @param blockRange The block range to fetch logs for
   * @param eventTopicList The event topic list from config
   * @returns Filtered array of logs
   */
  async getFilteredLogsForBlockRange(
    blockRange: { fromBlock: number; toBlock: number },
    eventTopicList: TopicList,
  ): Promise<Array<Log>> {
    this.logger.debug(
      `Getting filtered logs for block range ${blockRange.fromBlock} to ${blockRange.toBlock}`,
    );

    // Get relevant topic filters for this block range
    const topicFilters = this.getRelevantTopicFilters(
      eventTopicList,
      blockRange,
    );

    // Use enhanced filter logs to get and filter the logs
    const logs = await this.enhancedFilterLogs(blockRange, topicFilters);
    this.logger.debug(`Retrieved ${logs.length} filtered logs for block range`);
    return logs;
  }

  /**
   * Fetches the current gas price using eth_gasPrice RPC call
   * @returns Current gas price in wei as bigint
   */
  async getGasPrice(): Promise<bigint> {
    this.logger.debug('Fetching current gas price');

    const gasPriceRequest = {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1,
    };

    const responseObservable = this.httpService.request({
      url: this.rpcUrl,
      method: 'post',
      data: gasPriceRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    const { data } = (await lastValueFrom(responseObservable)) as any;

    if (!data.result) {
      throw new Error('Failed to fetch gas price');
    }

    this.logger.debug(`Current gas price: ${data.result}`);
    return BigInt(data.result);
  }

  getUrl(): string {
    return this.rpcUrl;
  }
}
