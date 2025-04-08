import { matchesEventPattern } from './event-pattern-matcher';

describe('matchesEventPattern', () => {
  describe('exact matches', () => {
    it('should match exact contract and event names', () => {
      expect(matchesEventPattern('Uniswap', 'Trade', 'Uniswap:Trade')).toBe(
        true,
      );
    });

    it('should not match when contract differs', () => {
      expect(matchesEventPattern('Sushi', 'Trade', 'Uniswap:Trade')).toBe(
        false,
      );
    });

    it('should not match when event differs', () => {
      expect(matchesEventPattern('Uniswap', 'Swap', 'Uniswap:Trade')).toBe(
        false,
      );
    });
  });

  describe('contract wildcards', () => {
    it('should match any contract with specific event', () => {
      expect(matchesEventPattern('Uniswap', 'Transfer', '*:Transfer')).toBe(
        true,
      );
      expect(matchesEventPattern('Sushi', 'Transfer', '*:Transfer')).toBe(true);
    });

    it('should not match different events with contract wildcard', () => {
      expect(matchesEventPattern('Uniswap', 'Trade', '*:Transfer')).toBe(false);
    });
  });

  describe('event wildcards', () => {
    it('should match any event from specific contract', () => {
      expect(matchesEventPattern('Uniswap', 'Trade', 'Uniswap:*')).toBe(true);
      expect(matchesEventPattern('Uniswap', 'Swap', 'Uniswap:*')).toBe(true);
    });

    it('should not match events from different contracts', () => {
      expect(matchesEventPattern('Sushi', 'Trade', 'Uniswap:*')).toBe(false);
    });
  });

  describe('full wildcards', () => {
    it('should match any contract and event combination', () => {
      expect(matchesEventPattern('Uniswap', 'Trade', '*:*')).toBe(true);
      expect(matchesEventPattern('Sushi', 'Swap', '*:*')).toBe(true);
      expect(matchesEventPattern('Token', 'Transfer', '*:*')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty contract names', () => {
      expect(matchesEventPattern('', 'Transfer', ':Transfer')).toBe(true);
      expect(matchesEventPattern('', 'Transfer', '*:Transfer')).toBe(true);
      expect(matchesEventPattern(null, 'Transfer', '*:Transfer')).toBe(true);
      expect(matchesEventPattern(undefined, 'Transfer', '*:Transfer')).toBe(
        true,
      );
    });

    it('should not match non-wildcard patterns when contract is empty/null/undefined', () => {
      expect(matchesEventPattern('', 'Transfer', 'Contract:Transfer')).toBe(
        false,
      );
      expect(matchesEventPattern(null, 'Transfer', 'Contract:Transfer')).toBe(
        false,
      );
      expect(
        matchesEventPattern(undefined, 'Transfer', 'Contract:Transfer'),
      ).toBe(false);
    });

    it('should handle empty event names', () => {
      expect(matchesEventPattern('Uniswap', '', 'Uniswap:')).toBe(true);
      expect(matchesEventPattern('Uniswap', '', 'Uniswap:*')).toBe(true);
    });
  });
});
