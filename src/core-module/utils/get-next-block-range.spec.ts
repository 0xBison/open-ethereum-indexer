import { getNextBlockRange } from './get-next-block-range';

describe('getNextBlockRange', () => {
  it('should return full range when requested blocks are less than range size', () => {
    const result = getNextBlockRange(100, 150, 100);
    expect(result).toEqual({
      fromBlock: 100,
      toBlock: 150,
    });
  });

  it('should return full range when requested blocks equal range size', () => {
    const result = getNextBlockRange(100, 199, 100);
    expect(result).toEqual({
      fromBlock: 100,
      toBlock: 199,
    });
  });

  it('should return partial range when requested blocks exceed range size', () => {
    const result = getNextBlockRange(100, 300, 100);
    expect(result).toEqual({
      fromBlock: 100,
      toBlock: 199,
    });
  });

  it('should handle single block range', () => {
    const result = getNextBlockRange(100, 100, 100);
    expect(result).toEqual({
      fromBlock: 100,
      toBlock: 100,
    });
  });
});
