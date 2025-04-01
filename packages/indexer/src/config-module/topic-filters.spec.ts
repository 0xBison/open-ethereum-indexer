import { Interface } from '@ethersproject/abi';
import { getTopicFiltersToSubscribe } from './topic-filters';
import { TopicList } from './types';
import { WILDCARD_ADDRESS } from './config.service';
import {
  mockTransferAbi,
  mockApprovalAbi,
  mockExcludedAbi,
} from './test/mock-abi';

describe('Topic Filters', () => {
  let transferTopic: string;
  let approvalTopic: string;
  let excludedTopic: string;
  let eventTopicList: TopicList;

  beforeEach(() => {
    // Get topic hashes
    const transferInterface = new Interface(mockTransferAbi);
    const approvalInterface = new Interface(mockApprovalAbi);
    const excludedInterface = new Interface(mockExcludedAbi);

    transferTopic = transferInterface.getEventTopic('Transfer');
    approvalTopic = approvalInterface.getEventTopic('Approval');
    excludedTopic = excludedInterface.getEventTopic('ExcludedEvent');

    // Create mock event topic list
    eventTopicList = {
      [transferTopic]: {
        eventName: 'Transfer',
        contractAddresses: ['0x1111111111111111111111111111111111111111'],
        eventFragment: mockTransferAbi[0],
        contractBlockRanges: {
          '0x1111111111111111111111111111111111111111': {
            startBlock: 100,
            endBlock: 200,
          },
        },
      },
      [approvalTopic]: {
        eventName: 'Approval',
        contractAddresses: ['0x2222222222222222222222222222222222222222'],
        eventFragment: mockApprovalAbi[0],
        contractBlockRanges: {
          '0x2222222222222222222222222222222222222222': {
            startBlock: 150,
            endBlock: 250,
          },
        },
      },
    };
  });

  it('should return topic filters active in the given block range', () => {
    // Block range 50-80: Before any events are active
    expect(getTopicFiltersToSubscribe(eventTopicList, 50, 80)).toEqual([]);

    // Block range 120-140: Only Transfer is active
    const filtersAt120 = getTopicFiltersToSubscribe(eventTopicList, 120, 140);
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);

    // Block range 160-180: Both Transfer and Approval are active
    const filtersAt160 = getTopicFiltersToSubscribe(eventTopicList, 160, 180);
    expect(filtersAt160.length).toBe(2);
    expect(filtersAt160.some((f) => f.topic === transferTopic)).toBe(true);
    expect(filtersAt160.some((f) => f.topic === approvalTopic)).toBe(true);

    // Block range 220-240: Only Approval is active
    const filtersAt220 = getTopicFiltersToSubscribe(eventTopicList, 220, 240);
    expect(filtersAt220.length).toBe(1);
    expect(filtersAt220[0].topic).toEqual(approvalTopic);
    expect(filtersAt220[0].addresses).toEqual([
      '0x2222222222222222222222222222222222222222',
    ]);

    // Block range 300-320: After all events are inactive
    expect(getTopicFiltersToSubscribe(eventTopicList, 300, 320)).toEqual([]);
  });

  it('should handle wildcard addresses correctly', () => {
    // Add a wildcard entry
    eventTopicList[transferTopic].contractAddresses.push(WILDCARD_ADDRESS);
    eventTopicList[transferTopic].contractBlockRanges[WILDCARD_ADDRESS] = {
      startBlock: 150,
      endBlock: 250,
    };

    // Block range 120-140: Only specific address is active
    const filtersAt120 = getTopicFiltersToSubscribe(eventTopicList, 120, 140);
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);

    // Block range 160-180: Both specific and wildcard are active
    // Should return just one filter with no addresses (wildcard takes precedence)
    const filtersAt160 = getTopicFiltersToSubscribe(eventTopicList, 160, 180);
    expect(filtersAt160.length).toBe(2); // Transfer and Approval

    // Find the Transfer filter (should have no addresses due to wildcard)
    const transferFilter = filtersAt160.find((f) => f.topic === transferTopic);
    expect(transferFilter).toBeDefined();
    expect(transferFilter?.addresses).toBeUndefined();

    // Find the Approval filter (should have address)
    const approvalFilter = filtersAt160.find((f) => f.topic === approvalTopic);
    expect(approvalFilter).toBeDefined();
    expect(approvalFilter?.addresses).toEqual([
      '0x2222222222222222222222222222222222222222',
    ]);

    // Block range 220-240: Both wildcard Transfer and specific Approval are active
    const filtersAt220 = getTopicFiltersToSubscribe(eventTopicList, 220, 240);
    expect(filtersAt220.length).toBe(2);

    // Find the Transfer filter (should have no addresses due to wildcard)
    const transferFilter220 = filtersAt220.find(
      (f) => f.topic === transferTopic,
    );
    expect(transferFilter220).toBeDefined();
    expect(transferFilter220?.addresses).toBeUndefined();
  });

  it('should handle single block queries', () => {
    // Single block query at block 100 (start of range)
    const filtersAt100 = getTopicFiltersToSubscribe(eventTopicList, 100, 100);
    expect(filtersAt100.length).toBe(1);
    expect(filtersAt100[0].topic).toEqual(transferTopic);

    // Single block query at block 200 (end of range)
    const filtersAt200 = getTopicFiltersToSubscribe(eventTopicList, 200, 200);

    expect(filtersAt200.length).toBe(2); // Both Transfer and Approval are active
    expect(filtersAt200.some((f) => f.topic === transferTopic)).toBe(true);
    expect(filtersAt200.some((f) => f.topic === approvalTopic)).toBe(true);

    // Single block query at block 99 (before range)
    const filtersAt99 = getTopicFiltersToSubscribe(eventTopicList, 99, 99);
    expect(filtersAt99.length).toBe(0);

    // Single block query at block 201 (after range)
    const filtersAt201 = getTopicFiltersToSubscribe(eventTopicList, 201, 201);
    expect(filtersAt201.length).toBe(1);
    expect(filtersAt201[0].topic).toEqual(approvalTopic);
  });

  it('should handle only wildcard addresses for an event', () => {
    // Create a new topic list with only wildcard addresses
    const wildcardTopicList: TopicList = {
      [transferTopic]: {
        eventName: 'Transfer',
        contractAddresses: [WILDCARD_ADDRESS],
        eventFragment: eventTopicList[transferTopic].eventFragment,
        contractBlockRanges: {
          [WILDCARD_ADDRESS]: {
            startBlock: 100,
            endBlock: 200,
          },
        },
      },
    };

    // Block range 120-140: Wildcard is active
    const filtersAt120 = getTopicFiltersToSubscribe(
      wildcardTopicList,
      120,
      140,
    );
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toBeUndefined(); // No address filter for wildcard
  });

  it('should handle mixed specific and wildcard addresses for the same event', () => {
    // Create a topic list with both specific and wildcard addresses for the same event
    const mixedTopicList: TopicList = {
      [transferTopic]: {
        eventName: 'Transfer',
        contractAddresses: [
          '0x1111111111111111111111111111111111111111',
          WILDCARD_ADDRESS,
        ],
        eventFragment: eventTopicList[transferTopic].eventFragment,
        contractBlockRanges: {
          '0x1111111111111111111111111111111111111111': {
            startBlock: 100,
            endBlock: 200,
          },
          [WILDCARD_ADDRESS]: {
            startBlock: 150,
            endBlock: 250,
          },
        },
      },
    };

    // Block range 120-140: Only specific address is active
    const filtersAt120 = getTopicFiltersToSubscribe(mixedTopicList, 120, 140);
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);

    // Block range 160-180: Both specific and wildcard are active
    // Should return just one filter with no addresses (wildcard takes precedence)
    const filtersAt160 = getTopicFiltersToSubscribe(mixedTopicList, 160, 180);
    expect(filtersAt160.length).toBe(1);
    expect(filtersAt160[0].topic).toEqual(transferTopic);
    expect(filtersAt160[0].addresses).toBeUndefined();

    // Block range 220-240: Only wildcard is active
    const filtersAt220 = getTopicFiltersToSubscribe(mixedTopicList, 220, 240);
    expect(filtersAt220.length).toBe(1);
    expect(filtersAt220[0].topic).toEqual(transferTopic);
    expect(filtersAt220[0].addresses).toBeUndefined();
  });

  it('should handle multiple contracts with the same event', () => {
    // Add another contract with the Transfer event
    eventTopicList[transferTopic].contractAddresses.push(
      '0x3333333333333333333333333333333333333333',
    );
    eventTopicList[transferTopic].contractBlockRanges[
      '0x3333333333333333333333333333333333333333'
    ] = {
      startBlock: 180,
      endBlock: 280,
    };

    // Block range 120-140: Only first contract is active
    const filtersAt120 = getTopicFiltersToSubscribe(eventTopicList, 120, 140);
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);

    // Block range 190-200: Both contracts with Transfer are active
    const filtersAt190 = getTopicFiltersToSubscribe(eventTopicList, 190, 200);
    expect(filtersAt190.length).toBe(2); // Transfer and Approval

    // Find the Transfer filter
    const transferFilter = filtersAt190.find((f) => f.topic === transferTopic);
    expect(transferFilter).toBeDefined();
    expect(transferFilter?.addresses).toContain(
      '0x1111111111111111111111111111111111111111',
    );
    expect(transferFilter?.addresses).toContain(
      '0x3333333333333333333333333333333333333333',
    );

    // Block range 250-260: Only the third contract is active for Transfer, and Approval is also active
    const filtersAt250 = getTopicFiltersToSubscribe(eventTopicList, 250, 260);
    expect(filtersAt250.length).toBe(2); // Both Transfer and Approval
    const transferFilter250 = filtersAt250.find(
      (f) => f.topic === transferTopic,
    );
    expect(transferFilter250).toBeDefined();
    expect(transferFilter250?.addresses).toEqual([
      '0x3333333333333333333333333333333333333333',
    ]);
  });

  it('should handle overlapping block ranges correctly', () => {
    // Create a topic list with overlapping block ranges
    const overlappingTopicList: TopicList = {
      [transferTopic]: {
        eventName: 'Transfer',
        contractAddresses: [
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222',
        ],
        eventFragment: eventTopicList[transferTopic].eventFragment,
        contractBlockRanges: {
          '0x1111111111111111111111111111111111111111': {
            startBlock: 100,
            endBlock: 200,
          },
          '0x2222222222222222222222222222222222222222': {
            startBlock: 150,
            endBlock: 250,
          },
        },
      },
    };

    // Block range 120-140: Only first contract is active
    const filtersAt120 = getTopicFiltersToSubscribe(
      overlappingTopicList,
      120,
      140,
    );
    expect(filtersAt120.length).toBe(1);
    expect(filtersAt120[0].topic).toEqual(transferTopic);
    expect(filtersAt120[0].addresses).toEqual([
      '0x1111111111111111111111111111111111111111',
    ]);

    // Block range 160-180: Both contracts are active
    const filtersAt160 = getTopicFiltersToSubscribe(
      overlappingTopicList,
      160,
      180,
    );
    expect(filtersAt160.length).toBe(1);
    expect(filtersAt160[0].topic).toEqual(transferTopic);
    expect(filtersAt160[0].addresses).toContain(
      '0x1111111111111111111111111111111111111111',
    );
    expect(filtersAt160[0].addresses).toContain(
      '0x2222222222222222222222222222222222222222',
    );

    // Block range 220-240: Only second contract is active
    const filtersAt220 = getTopicFiltersToSubscribe(
      overlappingTopicList,
      220,
      240,
    );
    expect(filtersAt220.length).toBe(1);
    expect(filtersAt220[0].topic).toEqual(transferTopic);
    expect(filtersAt220[0].addresses).toEqual([
      '0x2222222222222222222222222222222222222222',
    ]);
  });
});
