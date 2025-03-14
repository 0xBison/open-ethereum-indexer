import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { getBlockNumber, getLatestBlock, mineNewBlock } from './node-functions';
import { deployContract } from 'solidity-event-test-suite';
import { getNodeSetup, NodeSetup } from './utils/node-setup';
import { IndexerTestSetup } from './utils/indexer-setup';
import { INestApplication } from '@nestjs/common';
import { sleep } from 'core-module';

// Set this to true to use containerized node, false for local node
const USE_CONTAINERIZED_NODE = false;

describe('Ethereum Indexer E2E Tests', () => {
  let nodeSetup: NodeSetup;
  let indexerSetup: IndexerTestSetup;
  let rpcUrl: string;
  let app: INestApplication;

  beforeAll(async () => {
    try {
      // Set up the node (either local or containerized)
      nodeSetup = getNodeSetup(USE_CONTAINERIZED_NODE);
      rpcUrl = await nodeSetup.setup();

      // Set up the indexer
      indexerSetup = new IndexerTestSetup();
      app = await indexerSetup.setupIndexer(rpcUrl);

      // Deploy a test contract
      const { contract } = await deployContract({
        wsUrl: rpcUrl,
      });

      console.log(`Contract deployed: ${contract.address}`);

      // Mine a block to trigger the indexer's sync process
      await mineNewBlock(rpcUrl);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error; // Re-throw to fail the test
    }
  }, 30000);

  afterAll(async () => {
    // Tear down the indexer
    await indexerSetup.teardownIndexer();

    // Tear down the node
    await nodeSetup.teardown();
  });

  it('should get block number using our node functions', async () => {
    const blockNumberHex = await getBlockNumber(rpcUrl);
    const blockNumber = parseInt(blockNumberHex, 16);

    expect(blockNumber).toBeGreaterThanOrEqual(0);
    console.log(`Current block number: ${blockNumber}`);
  });

  it('should get latest block details', async () => {
    const block = await getLatestBlock(rpcUrl);

    expect(block).toBeDefined();
    expect(block.number).toBeDefined();
    const blockNumber = parseInt(block.number, 16);

    console.log(`Latest block number: ${blockNumber}`);
    console.log(`Block timestamp: ${parseInt(block.timestamp, 16)}`);
  });

  it('should have the indexer running and check for errors', async () => {
    // This is just a basic test to verify the indexer is running
    expect(app).toBeDefined();

    // Mine a block to trigger the indexer's processing
    await mineNewBlock(rpcUrl);

    // Add a delay to allow time for the sync process to run and potentially error
    await sleep(10000);

  });
});
