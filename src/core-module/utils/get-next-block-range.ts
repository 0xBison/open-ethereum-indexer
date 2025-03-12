import { BlockRange } from '../types';

/**
 * Gets the range of blocks to request in the next `getLogs` query.
 *
 * `eth_getLogs` requests are inclusive to both the start and end blocks specified and
 * so we need to make the ranges exclusive of one another to avoid fetching the same
 * blocks' logs twice
 *
 * @param from Start block to get blocks from
 * @param to Final block to get blocks to
 * @param rangeSize The maximum amount of logs to request in a single query
 * @returns A BlockRange to and from fields which can be used in a `getLogs` query.
 */
export const getNextBlockRange = (
  from: number,
  to: number,
  rangeSize: number,
): BlockRange => {
  const blocksRequested = to - from + 1;

  if (blocksRequested > rangeSize) {
    return {
      fromBlock: from,
      toBlock: from + rangeSize - 1,
    };
  }

  return { fromBlock: from, toBlock: to };
};
