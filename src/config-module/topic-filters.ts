import { TopicFilter, TopicList } from './types';
import { WILDCARD_ADDRESS } from './config.service';

/**
 * Get topic filters to subscribe to for a specific block range
 * @param eventTopicList The event topic list
 * @param startBlock The start block number (inclusive)
 * @param endBlock The end block number (inclusive)
 * @returns Array of topic filters with addresses if specified
 */
export function getTopicFiltersToSubscribe(
  eventTopicList: TopicList,
  startBlock: number,
  endBlock: number,
): TopicFilter[] {
  const topicFilters: TopicFilter[] = [];
  const processedTopics = new Set<string>();

  for (const [topicHash, eventInfo] of Object.entries(eventTopicList)) {
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
    const hasWildcard = eventInfo.contractAddresses.includes(WILDCARD_ADDRESS);
    const wildcardActive =
      hasWildcard &&
      eventInfo.contractBlockRanges[WILDCARD_ADDRESS].startBlock <= endBlock &&
      eventInfo.contractBlockRanges[WILDCARD_ADDRESS].endBlock >= startBlock;

    if (activeAddresses.length > 0 || wildcardActive) {
      const filter: TopicFilter = {
        topic: topicHash, // Changed from topics array to single topic
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
