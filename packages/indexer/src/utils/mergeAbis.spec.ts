import { mergeEventAbis } from './mergeAbis';

describe('mergeEventAbis', () => {
  // Common event definitions
  const transferEvent = {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value', indexed: false },
    ],
    anonymous: false,
  };

  const approvalEvent = {
    type: 'event',
    name: 'Approval',
    inputs: [
      { type: 'address', name: 'owner', indexed: true },
      { type: 'address', name: 'spender', indexed: true },
      { type: 'uint256', name: 'value', indexed: false },
    ],
    anonymous: false,
  };

  const transferFunction = {
    type: 'function',
    name: 'transfer',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
    ],
    outputs: [{ type: 'bool' }],
  };

  // Event with different field names but same signature
  const transferEventDifferentNames = {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'sender', indexed: true },
      { type: 'address', name: 'recipient', indexed: true },
      { type: 'uint256', name: 'amount', indexed: false },
    ],
    anonymous: false,
  };

  // Event with different indexed flag
  const transferEventDifferentIndexed = {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', name: 'from', indexed: true },
      { type: 'address', name: 'to', indexed: true },
      { type: 'uint256', name: 'value', indexed: true }, // Different indexed flag
    ],
    anonymous: false,
  };

  // Helper for mocking console.warn
  const mockConsoleWarn = () => {
    const originalWarn = console.warn;
    const mockWarn = jest.fn();
    console.warn = mockWarn;
    return {
      mockWarn,
      restore: () => {
        console.warn = originalWarn;
      },
    };
  };

  // Basic test - merging works
  test('merges events from multiple ABIs', () => {
    const abi1 = [transferEvent, transferFunction];
    const abi2 = [approvalEvent];

    const merged = mergeEventAbis(abi1, abi2);

    // Should only include events
    expect(merged.length).toBe(2);
    expect(merged.every((item) => item.type === 'event')).toBe(true);

    // Check exact structure of events
    expect(merged).toEqual(
      expect.arrayContaining([
        expect.objectContaining(transferEvent),
        expect.objectContaining(approvalEvent),
      ]),
    );

    // Ensure function was filtered out
    expect(
      merged.find(
        (item) => item.name === 'transfer' && item.type === 'function',
      ),
    ).toBeUndefined();
  });

  // Test for duplicates with identical definitions
  test('removes duplicate events with identical definitions', () => {
    const abi1 = [transferEvent];
    const abi2 = [transferEvent]; // Exact same event definition

    const merged = mergeEventAbis(abi1, abi2);

    // Should only include one event
    expect(merged.length).toBe(1);

    // Check exact structure of the event
    expect(merged[0]).toEqual(transferEvent);
  });

  // Test for warning when same signature but different field names
  test('warns about events with same signature but different field names', () => {
    const { mockWarn, restore } = mockConsoleWarn();
    process.env.NODE_ENV = 'test';

    const abi1 = [transferEvent];
    const abi2 = [transferEventDifferentNames];

    const merged = mergeEventAbis(abi1, abi2);

    // Should generate a warning
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING: Event with signature "Transfer(address,address,uint256)" has different definitions',
      ),
    );

    // For extra validation using our warningCount
    expect((merged as any).warningCount).toBe(1);

    // Ensure the first event definition is kept
    expect(merged.length).toBe(1);
    expect(merged[0]).toEqual(transferEvent);
    expect(merged[0]).not.toEqual(transferEventDifferentNames);

    restore();
  });

  // Test for warning when same signature but different indexed flag
  test('warns about events with same signature but different indexed flags', () => {
    const { mockWarn, restore } = mockConsoleWarn();
    process.env.NODE_ENV = 'test';

    const abi1 = [transferEvent];
    const abi2 = [transferEventDifferentIndexed];

    const merged = mergeEventAbis(abi1, abi2);

    // Should generate a warning
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING: Event with signature "Transfer(address,address,uint256)" has different definitions',
      ),
    );

    // Ensure the first event definition is kept
    expect(merged.length).toBe(1);
    expect(merged[0]).toEqual(transferEvent);
    expect(merged[0]).not.toEqual(transferEventDifferentIndexed);

    // Specifically check that the indexed flag wasn't changed
    expect(merged[0].inputs[2].indexed).toBe(false);

    restore();
  });

  // Test with non-array input
  test('handles non-array input gracefully', () => {
    const { mockWarn, restore } = mockConsoleWarn();

    const abi1 = [transferEvent];

    // @ts-ignore - intentionally passing invalid type for testing
    const merged = mergeEventAbis(abi1, { not: 'an-array' });

    // Should warn about invalid input
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping non-array ABI input'),
    );

    // Should still process valid inputs and maintain their exact structure
    expect(merged.length).toBe(1);
    expect(merged[0]).toEqual(transferEvent);

    restore();
  });

  // Test with multiple events with different signatures
  test('keeps all events with different signatures', () => {
    const customEvent1 = {
      type: 'event',
      name: 'CustomEvent',
      inputs: [{ type: 'uint256', name: 'value', indexed: false }],
      anonymous: false,
    };

    const customEvent2 = {
      type: 'event',
      name: 'CustomEvent',
      inputs: [
        { type: 'address', name: 'account', indexed: true },
        { type: 'uint256', name: 'value', indexed: false },
      ],
      anonymous: false,
    };

    const abi1 = [transferEvent, customEvent1];
    const abi2 = [approvalEvent, customEvent2];

    const merged = mergeEventAbis(abi1, abi2);

    // Should keep all events with different signatures
    expect(merged.length).toBe(4);

    // Check that each event is included exactly once with correct structure
    expect(merged).toEqual(
      expect.arrayContaining([
        expect.objectContaining(transferEvent),
        expect.objectContaining(approvalEvent),
        expect.objectContaining(customEvent1),
        expect.objectContaining(customEvent2),
      ]),
    );

    // Check events by name and signature
    const customEvents = merged.filter((event) => event.name === 'CustomEvent');
    expect(customEvents.length).toBe(2);

    // Find the specific events by checking their inputs length
    const customEvent1Result = customEvents.find(
      (event) =>
        event.inputs.length === 1 && event.inputs[0].type === 'uint256',
    );
    const customEvent2Result = customEvents.find(
      (event) =>
        event.inputs.length === 2 && event.inputs[0].type === 'address',
    );

    expect(customEvent1Result).toEqual(customEvent1);
    expect(customEvent2Result).toEqual(customEvent2);
  });
});
