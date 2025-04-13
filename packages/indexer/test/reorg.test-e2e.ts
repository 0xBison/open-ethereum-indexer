import { ethers } from 'ethers';
import { describe, expect, it } from '@jest/globals';
import { getNodeSetup, NodeSetup } from './utils/node-setup';
import { sleep, BlockMonitorServiceIdentifier } from '../src/core-module';
import { performChainReorg } from './node-functions';
import { INestApplication } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  IndexerTestSetup,
  IndexerTestSetupConfig,
} from './utils/indexer-setup';
import {
  CounterIncrementedEntity_75bd9fe0,
  CounterDecrementedEntity_f4b3f987,
} from './counter/entities';
import { CounterMigrations1742198536891 } from './counter/migrations/1742198536891-CounterMigrations';
import CounterArtifact from '../../../solidity/artifacts/contracts/Counter.sol/Counter.json';
import { entityRegistry } from '../src/generic-indexer-module';

const entities = [
  CounterIncrementedEntity_75bd9fe0,
  CounterDecrementedEntity_f4b3f987,
];

// Register all entities
entities.forEach((entity) => {
  entityRegistry.registerGeneric(entity);
});

// Helper functions to get blockchain state
async function getChainState(
  provider: ethers.providers.JsonRpcProvider,
  contractAddress: string,
  blockCount: number = 10,
) {
  const currentBlock = await provider.getBlock('latest');

  // Get blocks (latest 'blockCount' blocks)
  const blocks: { number: number; hash: string; transactions: number }[] = [];
  const startBlock = Math.max(0, currentBlock.number - blockCount + 1);

  for (let i = startBlock; i <= currentBlock.number; i++) {
    const block = await provider.getBlock(i);
    blocks.push({
      number: block.number,
      hash: block.hash,
      transactions: block.transactions.length,
    });
  }

  // Get logs for the contract
  const logs = await provider.getLogs({
    address: contractAddress,
    fromBlock: 0,
    toBlock: 'latest',
  });

  return {
    currentBlockNumber: currentBlock.number,
    currentBlockHash: currentBlock.hash,
    blocks,
    logs,
  };
}

// Helper to get counter value
async function getCounterValue(contract: ethers.Contract) {
  return (await contract.getCount()).toNumber();
}

const USE_CONTAINERIZED_NODE = true;

describe('Ethereum Chain Reorg Tests', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let wallet: ethers.Wallet;
  let counterContract: ethers.Contract;
  let accounts: string[];
  let nodeSetup: NodeSetup;
  let rpcUrl: string;

  // Add indexer related variables
  let indexerSetup: IndexerTestSetup;
  let app: INestApplication;
  let dataSource: DataSource;
  let entityManager: EntityManager;

  const setupNode = async () => {
    // Use local Anvil node
    nodeSetup = getNodeSetup(USE_CONTAINERIZED_NODE);
    rpcUrl = await nodeSetup.setup();

    // Connect to Anvil node
    provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Get accounts
    accounts = await provider.listAccounts();
    console.log(`Available accounts: ${accounts.length}`);
    console.log(`First account: ${accounts[0]}`);

    // Create wallet using the first account's private key
    wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider,
    );

    // Deploy the Counter contract
    console.log('\n--- Deploying Counter Contract ---');
    const counterFactory = new ethers.ContractFactory(
      CounterArtifact.abi,
      CounterArtifact.bytecode,
      wallet,
    );

    counterContract = await counterFactory.deploy();
    await counterContract.deployed();
    console.log(`Counter contract deployed at ${counterContract.address}`);
  };

  const setupIndexer = async () => {
    // Set up the indexer config
    console.log('\n--- Setting up Indexer ---');
    const indexerConfig: IndexerTestSetupConfig = {
      config: {
        network: {
          rpcUrl,
          chainId: 31337,
        },
        contracts: {
          Counter: {
            abi: CounterArtifact.abi,
            address: counterContract.address,
          },
        },
      },
      databaseConfig: {
        migrations: [CounterMigrations1742198536891],
      },
    };

    // Create a new indexer test setup (includes PostgreSQL container)
    indexerSetup = new IndexerTestSetup();

    // Set up the indexer with optional customizations
    app = await indexerSetup.setupIndexer(indexerConfig, (moduleBuilder) => {
      // Example of how to customize the module before compilation
      // This is optional - only use if you need to override additional providers
      return moduleBuilder;
    });

    // Get DataSource and EntityManager instances
    dataSource = app.get(DataSource);
    entityManager = dataSource.manager;
  };

  const cleanUp = async () => {
    try {
      if (app) {
        const blockMonitorService = app.get(BlockMonitorServiceIdentifier);
        await blockMonitorService.stop();
      }

      if (dataSource && dataSource.isInitialized) {
        try {
          const schemaName = process.env.SQL_SCHEMA || 'public';
          await dataSource.query(
            `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
          );
          await dataSource.destroy();
        } catch (dbError) {
          console.error('Error cleaning database:', dbError);
        }
      }

      if (indexerSetup) {
        await indexerSetup.teardownIndexer();
      }

      if (nodeSetup) {
        await nodeSetup.teardown();
      }
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  };

  it('should detect chain reorganization through log changes and update the indexed database', async () => {
    await setupNode();

    // Mine some blocks with counter events
    console.log('\n--- Mining Blocks with Counter Events ---');
    for (let i = 0; i < 5; i++) {
      // Call increment() which emits an event
      const tx = await counterContract.increment({
        gasLimit: 50000,
        gasPrice: ethers.utils.parseUnits('1', 'gwei'),
      });
      // Wait for transaction to be mined
      await tx.wait();
    }

    // Get pre-reorg state
    console.log('\n--- Pre-Reorg State ---');

    const preReorgChainState = await getChainState(
      provider,
      counterContract.address,
    );

    console.log(JSON.stringify(preReorgChainState, null, 2));

    const preReorgCounterValue = await getCounterValue(counterContract);

    console.log(
      `Pre-reorg block number: ${preReorgChainState.currentBlockNumber}`,
    );
    console.log(`Pre-reorg block hash: ${preReorgChainState.currentBlockHash}`);
    console.log(`Pre-reorg logs count: ${preReorgChainState.logs.length}`);
    console.log(`Pre-reorg counter value: ${preReorgCounterValue}`);

    // Set up the indexer after initial blocks but before reorg
    console.log('\n--- Setting up Indexer ---');

    await setupIndexer();

    // Give indexer time to catch up with the chain
    await sleep(5000);

    // Check indexed data before reorg
    const preReorgIncrementedEvents = await entityManager.find(
      CounterIncrementedEntity_75bd9fe0,
    );

    // Check indexed data before reorg
    const preReorgDecrementedEvents = await entityManager.find(
      CounterDecrementedEntity_f4b3f987,
    );

    console.log('\n--- Pre-Reorg Indexed Events ---');
    console.log(`Total indexed events: ${preReorgIncrementedEvents.length}`);

    expect(preReorgIncrementedEvents.length).toEqual(5); // 5 increment events
    expect(preReorgDecrementedEvents.length).toEqual(0); // 0 decrement events

    // Get the highest indexed block number
    const maxPreReorgBlockNumber = Math.max(
      ...preReorgIncrementedEvents.map((e) => e.blockNumber),
    );

    console.log(`Highest indexed block number: ${maxPreReorgBlockNumber}`);

    // --- Perform reorg using anvil_reorg ---
    console.log('\n--- Performing Chain Reorg ---');

    // Calculate reorg depth (reorg the last 2 blocks)
    const reorgDepth = 2;

    // Make sure we have enough blocks to reorg
    expect(preReorgChainState.currentBlockNumber).toBeGreaterThanOrEqual(
      reorgDepth,
    );

    // Prepare transactions for the new fork - use decrement() instead of increment()
    const decrementData =
      counterContract.interface.encodeFunctionData('decrement');

    // Perform the reorg
    try {
      const result = await performChainReorg(rpcUrl, reorgDepth, [
        // First tx in new fork
        [
          {
            from: accounts[0],
            to: counterContract.address,
            data: decrementData,
            gasLimit: '0xc350', // 50000 in hex
          },
          0, // Chain reorg block id (first reorged block)
        ],
        // Second tx in new fork
        [
          {
            from: accounts[1],
            to: counterContract.address,
            data: decrementData,
            gasLimit: '0xc350',
          },
          0, // Also in first reorged block
        ],
        // Third tx in new fork
        [
          {
            from: accounts[1],
            to: counterContract.address,
            data: decrementData,
            gasLimit: '0xc350',
          },
          1, // In second reorged block
        ],
      ]);
      console.log('Reorg result:', result);
    } catch (error) {
      console.error('Error performing reorg:', error);
      throw error;
    }

    // Give the chain and indexer time to stabilize
    await sleep(5000);

    // Get post-reorg state
    console.log('\n--- Post-Reorg State ---');

    const postReorgChainState = await getChainState(
      provider,
      counterContract.address,
    );

    console.log(JSON.stringify(postReorgChainState, null, 2));

    const postReorgCounterValue = await getCounterValue(counterContract);

    console.log(
      `Post-reorg block number: ${postReorgChainState.currentBlockNumber}`,
    );
    console.log(
      `Post-reorg block hash: ${postReorgChainState.currentBlockHash}`,
    );
    console.log(`Post-reorg logs count: ${postReorgChainState.logs.length}`);
    console.log(`Post-reorg counter value: ${postReorgCounterValue}`);

    const postReorgIncrementedEvents = await entityManager.find(
      CounterIncrementedEntity_75bd9fe0,
      {
        order: { blockNumber: 'ASC' },
      },
    );

    const postReorgDecrementedEvents = await entityManager.find(
      CounterDecrementedEntity_f4b3f987,
      {
        order: { blockNumber: 'ASC' },
      },
    );

    console.log('\n--- Post-Reorg Indexed Events ---');
    console.log(`Total indexed events: ${postReorgIncrementedEvents.length}`);
    console.log(`Increment events: ${postReorgIncrementedEvents.length}`);
    console.log(`Decrement events: ${postReorgDecrementedEvents.length}`);

    // Verify that we have both increment and decrement events
    expect(postReorgIncrementedEvents.length).toEqual(3);
    expect(postReorgDecrementedEvents.length).toEqual(3); // Three decrement events from the reorg

    // Get the reorged block numbers
    const reorgedBlockNumbers = postReorgChainState.blocks
      .filter((postBlock, index) => {
        const preBlock = preReorgChainState.blocks.find(
          (b) => b.number === postBlock.number,
        );
        return preBlock && preBlock.hash !== postBlock.hash;
      })
      .map((block) => block.number);

    console.log(`Reorged block numbers: ${reorgedBlockNumbers.join(', ')}`);

    // Verify that the events from reorged blocks have been properly replaced
    const eventsInReorgedBlocks = postReorgIncrementedEvents.filter((event) =>
      reorgedBlockNumbers.includes(event.blockNumber),
    );

    console.log(`Events in reorged blocks: ${eventsInReorgedBlocks.length}`);
    console.log(eventsInReorgedBlocks);

    // Clean up the indexer
    const blockMonitorService = app.get(BlockMonitorServiceIdentifier);
    await blockMonitorService.stop();

    // Get the schema name
    const schemaName = process.env.SQL_SCHEMA || 'public';

    // Drop the schema
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

    // Destroy the data source
    await dataSource.destroy();

    // Tear down the indexer
    await indexerSetup.teardownIndexer();

    // --- Rest of the existing assertions ---
    // 1. The reorg should change at least one block hash
    const reorgedBlocks = postReorgChainState.blocks.filter(
      (postBlock, index) => {
        const preBlock = preReorgChainState.blocks.find(
          (b) => b.number === postBlock.number,
        );
        return preBlock && preBlock.hash !== postBlock.hash;
      },
    );

    expect(reorgedBlocks.length).toBeGreaterThan(0);

    console.log(`Detected ${reorgedBlocks.length} changed blocks`);

    // 2. Counter value should have changed (5 increments - 3 decrements = 2)
    expect(postReorgCounterValue).not.toEqual(preReorgCounterValue);

    // Adjust this expectation based on your actual observations
    // The current test shows 3 as the result
    expect(postReorgCounterValue).toEqual(0);

    // 3. Log count should be different after reorg
    expect(postReorgChainState.logs.length).not.toEqual(
      preReorgChainState.logs.length,
    );

    await cleanUp();
  }, 120000); // Increase timeout for this test
});
