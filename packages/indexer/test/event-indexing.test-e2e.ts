import { beforeEach, describe, expect, it } from '@jest/globals';
import { mineNewBlock } from './node-functions';
import { deployContract } from 'solidity-event-test-suite';
import { getNodeSetup, NodeSetup } from './utils/node-setup';
import {
  IndexerTestSetup,
  IndexerTestSetupConfig,
} from './utils/indexer-setup';
import { INestApplication } from '@nestjs/common';
import {
  BlockMonitorServiceIdentifier,
  EVENT_MANAGER_SERVICE,
  onBlock,
  onEvent,
  sleep,
} from '../src/core-module';
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
import { EventManagerService } from '../src/core-module';

// Set this to true to use containerized node, false for local node
const USE_CONTAINERIZED_NODE = true;

describe('Test event indexing of SomeContract - Exhaustive solidity event test suite', () => {
  let nodeSetup: NodeSetup;
  let indexerSetup: IndexerTestSetup;
  let rpcUrl: string;
  let app: INestApplication;
  let contractAddress: string;
  let contract: ethers.Contract;
  let dataSource: DataSource;
  let entityManager: EntityManager;

  const setup = async () => {
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
  };

  beforeEach(setup, 60000);

  const teardown = async () => {
    try {
      // Get the block monitor service
      const blockMonitorService = app.get(BlockMonitorServiceIdentifier);

      // Stop the block monitor service
      await blockMonitorService.stop();

      // Get the schema name from environment or use a default
      const schemaName = process.env.SQL_SCHEMA || 'public';

      console.log('Dropping schema:', schemaName);

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

  it('should trigger event listeners on event emission', async () => {
    const onEventSpyWildcard = jest.fn();
    const onEventSpySimpleEvent = jest.fn();

    const eventManagerService: EventManagerService = app.get(
      EVENT_MANAGER_SERVICE,
    );

    eventManagerService.onEvent('*:*', {
      onIndex: async () => {
        onEventSpyWildcard();
      },
    });

    eventManagerService.onEvent('SomeContract:SimpleEvent', {
      onIndex: async () => {
        onEventSpySimpleEvent();
      },
    });

    console.log('Emitting SimpleEvent...');
    await (await contract.emitSimpleEvent()).wait();
    await mineNewBlock(rpcUrl);

    await sleep(5000);

    await teardown();

    expect(onEventSpyWildcard).toHaveBeenCalled();
    expect(onEventSpySimpleEvent).toHaveBeenCalled();
  });

  it('should trigger event listeners on block events', async () => {
    const onBlockSpy = jest.fn();

    const eventManagerService: EventManagerService = app.get(
      EVENT_MANAGER_SERVICE,
    );

    eventManagerService.onBlock({
      onIndex: async () => {
        onBlockSpy();
      },
    });

    await mineNewBlock(rpcUrl);

    await sleep(5000);

    await teardown();

    expect(onBlockSpy).toHaveBeenCalled();
  });
});
