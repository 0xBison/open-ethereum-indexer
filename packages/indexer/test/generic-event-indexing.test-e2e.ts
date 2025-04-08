import { beforeEach, describe, expect, it } from '@jest/globals';
import { mineNewBlock } from './node-functions';
import { deployContract } from 'solidity-event-test-suite';
import { getNodeSetup, NodeSetup } from './utils/node-setup';
import {
  IndexerTestSetup,
  IndexerTestSetupConfig,
} from './utils/indexer-setup';
import { INestApplication } from '@nestjs/common';
import { BlockMonitorServiceIdentifier, sleep } from 'core-module';
import { DataSource, EntityManager } from 'typeorm';
import {
  DynamicArrayEntity_439e6b8c,
  DynamicArrayEntity_e56f559a,
  DynamicStructArrayEntity_de916601,
  EventWithDynamicArrayEntity_e56f559a,
  EventWithFixedArrayEntity_696b4daf,
  EventWithStructWithNestedStructEntity_4ec25295,
  EventWithStructWithFixedStructArrayEntity_68e489fd,
  EventWithStructWithDynamicStructArrayEntity_de916601,
  EventWithStructWithArraysEntity_439e6b8c,
  SimpleEventEntity_f9536490,
  SimpleStructEntity_4ec25295,
  StructArrayEntity_68e489fd,
  TheStructEntity_439e6b8c,
  TheStructEntity_4ec25295,
  TheStructEntity_68e489fd,
  TheStructEntity_de916601,
  Uint64ArrayEntity_439e6b8c,
  Uint64ArrayEntity_696b4daf,
} from './someContract/entities';
import { ethers } from 'ethers';
import SomeContractAbi from './someContract/abis/SomeContract.json';
import { InitialSchema1742274226041 } from './someContract/migrations/1742274226041-InitialSchema';

// Set this to true to use containerized node, false for local node
const USE_CONTAINERIZED_NODE = true;

const INDEX_WAIT_TIME = 3000;
const TEST_TIMEOUT = 60000;

describe('Test event indexing of SomeContract - Exhaustive solidity event test suite', () => {
  let nodeSetup: NodeSetup;
  let indexerSetup: IndexerTestSetup;
  let rpcUrl: string;
  let app: INestApplication;
  let contractAddress: string;
  let contract: ethers.Contract;
  let dataSource: DataSource;
  let entityManager: EntityManager;

  beforeEach(async () => {
    try {
      // Set up the node (either local or containerized)
      nodeSetup = getNodeSetup(USE_CONTAINERIZED_NODE);
      rpcUrl = await nodeSetup.setup();

      // Deploy SomeContract using the artifact
      const deployedContract = await deployContract({
        wsUrl: rpcUrl,
      });

      contractAddress = deployedContract.contract.address;
      contract = deployedContract.contract;

      console.log(`SomeContract deployed: ${contractAddress}`);

      const indexerConfig: IndexerTestSetupConfig = {
        config: {
          network: {
            rpcUrl,
            chainId: 31337,
          },
          contracts: {
            SomeContract: {
              abi: SomeContractAbi,
              address: contractAddress,
            },
          },
        },
        databaseConfig: {
          entities: [
            DynamicArrayEntity_439e6b8c,
            DynamicArrayEntity_e56f559a,
            DynamicStructArrayEntity_de916601,
            EventWithDynamicArrayEntity_e56f559a,
            EventWithFixedArrayEntity_696b4daf,
            EventWithStructWithNestedStructEntity_4ec25295,
            EventWithStructWithFixedStructArrayEntity_68e489fd,
            EventWithStructWithDynamicStructArrayEntity_de916601,
            EventWithStructWithArraysEntity_439e6b8c,
            SimpleEventEntity_f9536490,
            SimpleStructEntity_4ec25295,
            StructArrayEntity_68e489fd,
            TheStructEntity_439e6b8c,
            TheStructEntity_4ec25295,
            TheStructEntity_68e489fd,
            TheStructEntity_de916601,
            Uint64ArrayEntity_439e6b8c,
            Uint64ArrayEntity_696b4daf,
          ],
          migrations: [InitialSchema1742274226041],
        },
      };

      // Set up the indexer
      indexerSetup = new IndexerTestSetup();
      app = await indexerSetup.setupIndexer(indexerConfig);

      // Get DataSource instance from the app
      dataSource = app.get(DataSource);

      // Get EntityManager from DataSource
      entityManager = dataSource.manager;

      // Mine a block to ensure all transactions are confirmed
      await mineNewBlock(rpcUrl);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error; // Re-throw to fail the test
    }
  }, 60000);

  const teardown = async () => {
    try {
      await sleep(10000);
      // Get the block monitor service
      const blockMonitorService = app.get(BlockMonitorServiceIdentifier);

      // Stop the block monitor service
      await blockMonitorService.stop();

      // Get the schema name from environment or use a default
      const schemaName = process.env.SQL_SCHEMA || 'public';

      // Drop the specific schema
      await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

      // Then destroy the data source
      await dataSource.destroy();

      // Tear down the indexer
      await indexerSetup.teardownIndexer();

      // Tear down the node
      await nodeSetup.teardown();

      // Give a small delay to ensure cleanup
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log('Teardown completed successfully');
    } catch (error) {
      console.error('Error during teardown:', error);
    }
  };

  it(
    'should have indexed SimpleEvent correctly',
    async () => {
      // Emit the event
      console.log('Emitting SimpleEvent...');
      await (await contract.emitSimpleEvent()).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Get the repository using entityManager
      const eventRepo = entityManager.getRepository(SimpleEventEntity_f9536490);
      const events = await eventRepo.find();

      // Teardown the indexer and node
      await teardown();

      expect(events.length).toBeGreaterThan(0);

      const event = events[0];
      expect(event.num64Value).toBeDefined();
      expect(event.boolValue).toBe(true);
      expect(event.stringValue).toBe('3');
      expect(event.addrValue).toBe(
        '0x0000000000000000000000000000000000000123',
      );
      expect(event.bytes1Value).toBe('0x04');
      expect(event.bytes32Value).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000005',
      );
      expect(event.int256Value).toBe('6');
      expect(event.int64Value).toBe('7');
      expect(event.someEnum).toBe('2'); // Enum C has value 2
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithFixedArray correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithFixedArray...');
      await (await contract.emitEventWithFixedArray()).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithFixedArrayEntity_696b4daf,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check array values
      expect(event!.uint64Array.length).toBe(3);

      // Sort the array by id just to be sure of order
      const sortedArray = [...event!.uint64Array].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedArray[0].uint64Array).toBe('1');
      expect(sortedArray[1].uint64Array).toBe('2');
      expect(sortedArray[2].uint64Array).toBe('3');
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithDynamicArray correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithDynamicArray...');
      const dynamicArray = [1, 2, 3, 4, 5];
      await (await contract.emitEventWithDynamicArray(dynamicArray)).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithDynamicArrayEntity_e56f559a,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check array values
      expect(event!.dynamicArray.length).toBe(5);

      // Sort the array by id to ensure order
      const sortedArray = [...event!.dynamicArray].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedArray[0].dynamicArray).toBe('1');
      expect(sortedArray[1].dynamicArray).toBe('2');
      expect(sortedArray[2].dynamicArray).toBe('3');
      expect(sortedArray[3].dynamicArray).toBe('4');
      expect(sortedArray[4].dynamicArray).toBe('5');
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithStructWithNestedStruct correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithStructWithNestedStruct...');
      await (await contract.emitEventWithStructWithNestedStruct()).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithStructWithNestedStructEntity_4ec25295,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check struct values
      expect(event!.theStruct).toBeDefined();
      expect(event!.theStruct.simpleStruct).toBeDefined();
      expect(event!.theStruct.simpleStruct.a).toBe('1');
      expect(event!.theStruct.simpleStruct.b).toBe('2');
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithStructWithFixedStructArray correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithStructWithFixedStructArray...');
      await (await contract.emitEventWithStructWithFixedStructArray()).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithStructWithFixedStructArrayEntity_68e489fd,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check struct array values
      expect(event!.theStruct).toBeDefined();
      expect(event!.theStruct.structArray).toBeDefined();
      expect(event!.theStruct.structArray.length).toBe(2);

      // Sort array by id to ensure order
      const sortedArray = [...event!.theStruct.structArray].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedArray[0].a).toBe('1');
      expect(sortedArray[0].b).toBe('2');
      expect(sortedArray[1].a).toBe('3');
      expect(sortedArray[1].b).toBe('4');
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithStructWithDynamicStructArray correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithStructWithDynamicStructArray...');
      const structArray = [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
        { a: 5, b: 6 },
      ];
      await (
        await contract.emitEventWithStructWithDynamicStructArray(structArray)
      ).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithStructWithDynamicStructArrayEntity_de916601,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check dynamic struct array values
      expect(event!.theStruct).toBeDefined();
      expect(event!.theStruct.dynamicStructArray).toBeDefined();
      expect(event!.theStruct.dynamicStructArray.length).toBe(3);

      // Sort array by id to ensure order
      const sortedArray = [...event!.theStruct.dynamicStructArray].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedArray[0].a).toBe('1');
      expect(sortedArray[0].b).toBe('2');
      expect(sortedArray[1].a).toBe('3');
      expect(sortedArray[1].b).toBe('4');
      expect(sortedArray[2].a).toBe('5');
      expect(sortedArray[2].b).toBe('6');
    },
    TEST_TIMEOUT,
  );

  it(
    'should have indexed EventWithStructWithArrays correctly',
    async () => {
      // Emit the event
      console.log('Emitting EventWithStructWithArrays...');
      const dynamicArray = [1, 2, 3, 4, 5];
      await (await contract.emitEventWithStructWithArrays(dynamicArray)).wait();
      await mineNewBlock(rpcUrl);

      // Allow some time for indexing
      await sleep(INDEX_WAIT_TIME);

      // Use entityManager to get the repository
      const eventRepo = entityManager.getRepository(
        EventWithStructWithArraysEntity_439e6b8c,
      );

      // First get the event without eager loading
      const events = await eventRepo.find({
        select: ['uniqueEventId'],
      });

      expect(events.length).toBeGreaterThan(0);

      // Then get the full event with eager loading
      const event = await eventRepo.findOne({
        where: { uniqueEventId: events[0].uniqueEventId },
      });

      // Teardown the indexer and node
      await teardown();

      // Check array values
      expect(event!.theStruct).toBeDefined();

      // Check fixed array
      expect(event!.theStruct.uint64Array).toBeDefined();
      expect(event!.theStruct.uint64Array.length).toBe(3);

      // Sort fixed array by id
      const sortedFixedArray = [...event!.theStruct.uint64Array].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedFixedArray[0].uint64Array).toBe('1');
      expect(sortedFixedArray[1].uint64Array).toBe('2');
      expect(sortedFixedArray[2].uint64Array).toBe('3');

      // Check dynamic array
      expect(event!.theStruct.dynamicArray).toBeDefined();
      expect(event!.theStruct.dynamicArray.length).toBe(5);

      // Sort dynamic array by id
      const sortedDynamicArray = [...event!.theStruct.dynamicArray].sort(
        (a, b) => parseInt(a.id) - parseInt(b.id),
      );

      expect(sortedDynamicArray[0].dynamicArray).toBe('1');
      expect(sortedDynamicArray[1].dynamicArray).toBe('2');
      expect(sortedDynamicArray[2].dynamicArray).toBe('3');
      expect(sortedDynamicArray[3].dynamicArray).toBe('4');
      expect(sortedDynamicArray[4].dynamicArray).toBe('5');
    },
    TEST_TIMEOUT,
  );
});
