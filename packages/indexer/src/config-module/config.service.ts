import { Inject, Injectable } from '@nestjs/common';
import { Interface } from '@ethersproject/abi';
import {
  Config,
  EventInfo,
  NetworkConfig,
  TopicList,
  TopicFilter,
} from './types';

// Wildcard address for matching any contract
export const WILDCARD_ADDRESS = '*';

// High number for "infinity" end block
export const MAX_BLOCK_NUMBER = Number.MAX_SAFE_INTEGER; // Max 32-bit integer

@Injectable()
export class ConfigService {
  private readonly config: Config;

  private readonly networkConfig: NetworkConfig;

  private readonly eventTopicList: TopicList = {};

  constructor(@Inject('CONFIG') config: Config) {
    this.config = config;
    this.networkConfig = config.network;
    this.registerConfig(config);
  }

  public getConfig(): Config {
    return this.config;
  }

  private registerConfig(config: Config) {
    for (const contractKey in config.contracts) {
      const { abi, address, startBlock, endBlock, excludeEvents } =
        config.contracts[contractKey];

      // Use wildcard if no address is provided
      const contractAddress = address || WILDCARD_ADDRESS;

      // Filter out excluded events
      const excludeEventsArray = excludeEvents ?? [];
      const filteredEvents = abi.filter(
        (fragment) =>
          fragment.type === 'event' &&
          (!fragment.name || !excludeEventsArray.includes(fragment.name)),
      );

      // Create interface to generate topic hashes
      const contractInterface = new Interface(abi);

      // Process each event
      for (const eventFragment of filteredEvents) {
        if (!eventFragment.name) continue;

        // Generate topic hash for this event
        const topicHash = contractInterface.getEventTopic(eventFragment.name);

        // Normalize block ranges
        const normalizedStartBlock = startBlock ?? 0;
        const normalizedEndBlock = endBlock ?? MAX_BLOCK_NUMBER;

        // If this topic hash is already in our map, update it
        if (this.eventTopicList[topicHash]) {
          const existingEvent = this.eventTopicList[topicHash];

          // Add this contract address if not already present
          if (!existingEvent.contractAddresses.includes(contractAddress)) {
            existingEvent.contractAddresses.push(contractAddress);
          }

          // Add block range for this contract
          existingEvent.contractBlockRanges[contractAddress] = {
            startBlock: normalizedStartBlock,
            endBlock: normalizedEndBlock,
          };
        } else {
          // Create new entry for this topic hash
          this.eventTopicList[topicHash] = {
            eventName: eventFragment.name,
            contractAddresses: [contractAddress],
            eventFragment,
            contractBlockRanges: {
              [contractAddress]: {
                startBlock: normalizedStartBlock,
                endBlock: normalizedEndBlock,
              },
            },
          };
        }
      }
    }
  }

  /**
   * Get topic filters to subscribe to for a specific block range
   * @param startBlock The start block number (inclusive)
   * @param endBlock The end block number (inclusive)
   * @returns Array of topic filters with addresses if specified
   */
  getTopicFiltersToSubscribe(
    startBlock: number,
    endBlock: number,
  ): TopicFilter[] {
    const topicFilters: TopicFilter[] = [];
    const processedTopics = new Set<string>();

    for (const [topicHash, eventInfo] of Object.entries(this.eventTopicList)) {
      if (processedTopics.has(topicHash)) continue;
      processedTopics.add(topicHash);

      // Find all addresses that have this event active in the block range
      const activeAddresses: string[] = [];

      for (const address of eventInfo.contractAddresses) {
        const range = eventInfo.contractBlockRanges[address];

        // Check if block range overlaps with our query range
        if (range.startBlock <= endBlock && range.endBlock >= startBlock) {
          if (address !== WILDCARD_ADDRESS) {
            activeAddresses.push(address);
          }
        }
      }

      // If we have a wildcard address for this topic, we don't need to filter by address
      const hasWildcard =
        eventInfo.contractAddresses.includes(WILDCARD_ADDRESS);
      const wildcardActive =
        hasWildcard &&
        eventInfo.contractBlockRanges[WILDCARD_ADDRESS].startBlock <=
          endBlock &&
        eventInfo.contractBlockRanges[WILDCARD_ADDRESS].endBlock >= startBlock;

      if (activeAddresses.length > 0 || wildcardActive) {
        const filter: TopicFilter = {
          topic: topicHash,
        };

        // Only add addresses if we don't have a wildcard and we have specific addresses
        if (!wildcardActive && activeAddresses.length > 0) {
          filter.addresses = activeAddresses;
        }

        topicFilters.push(filter);
      }
    }

    return topicFilters;
  }

  /**
   * Get event details for a specific topic hash
   * @param topicHash The topic hash to look up
   * @returns Event information or null if not found
   */
  getEventDetails(topicHash: string): EventInfo | null {
    return this.eventTopicList[topicHash] || null;
  }

  /**
   * Check if an address matches any of the contract addresses for an event
   * @param addresses Array of contract addresses
   * @param logAddress Address from the log
   * @returns True if the address matches or if wildcard is present
   */
  checkAddressMatches(addresses: string[], logAddress: string): boolean {
    return (
      addresses.includes(WILDCARD_ADDRESS) ||
      addresses.some(
        (address) =>
          address !== WILDCARD_ADDRESS &&
          address.toLowerCase() === logAddress.toLowerCase(),
      )
    );
  }

  /**
   * Get the network config
   * @returns The network config
   */
  getNetworkConfig(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get the event topic list
   * @returns The event topic list
   */
  getEventTopicList(): TopicList {
    return this.eventTopicList;
  }

  /**
   * Get the start block for the contracts.
   * If no contracts are being monitored, returns null.
   *
   * @returns The start block for the contracts
   */
  getStartBlock(): number | null {
    if (Object.keys(this.config.contracts).length < 1) {
      return null;
    }

    return Object.values(this.config.contracts).reduce((min, contract) => {
      return Math.min(min, contract.startBlock ?? 0);
    }, Number.MAX_SAFE_INTEGER);
  }
}
