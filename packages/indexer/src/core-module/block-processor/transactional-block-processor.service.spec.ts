import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionalBlockProcessor } from './transactional-block-processor.service';
import {
  SQLTransactionService,
  SQLTransactionServiceIdentifier,
} from '../../sql-transaction-module/sql-transaction.service';
import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  A,
  B,
  C,
  BlockIndex,
  TestLogger,
} from '../../sql-transaction-module/test/shared-test-utils';

describe('TransactionalBlockProcessor', () => {
  let reorgService: TransactionalBlockProcessor;
  let transactionService: SQLTransactionService;
  let entityManager: EntityManager;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [A, B, C, BlockIndex],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([A, B, C, BlockIndex]),
      ],
      providers: [
        {
          provide: SQLTransactionServiceIdentifier,
          useClass: SQLTransactionService,
        },
        TransactionalBlockProcessor,
        {
          provide: Logger,
          useClass: TestLogger,
        },
      ],
    }).compile();

    reorgService = moduleRef.get<TransactionalBlockProcessor>(
      TransactionalBlockProcessor,
    );
    transactionService = moduleRef.get<SQLTransactionService>(
      SQLTransactionServiceIdentifier,
    );
    entityManager = moduleRef.get<EntityManager>(EntityManager);
  });

  it('should process blocks and store undo operations', async () => {
    // Process block 1
    await reorgService.processBlock(1, async () => {
      // Use the transaction service provided by the reorg service
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);
    });

    // Verify block was processed and stored
    const blockIndex = await entityManager.findOne(BlockIndex, {
      where: { blockNumber: 1 },
    });

    expect(blockIndex).not.toBeNull();
    expect(blockIndex?.blockNumber).toBe(1);
    expect(blockIndex?.undoOperations).toBeTruthy();

    // Verify entity was created
    const entityA = await entityManager.findOne(A, {
      where: { value1: 10, value2: 20 },
    });
    expect(entityA).not.toBeNull();
  });

  it('should revert blocks using stored undo operations', async () => {
    // Process block
    await reorgService.processBlock(1, async () => {
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);
    });

    // Verify entity exists
    const entitiesBeforeRevert = await entityManager.find(A);
    expect(entitiesBeforeRevert.length).toBe(1);

    // Revert block
    await reorgService.revertBlock(1);

    // Verify entity was removed
    const entitiesAfterRevert = await entityManager.find(A);
    expect(entitiesAfterRevert.length).toBe(0);

    // Verify block index was removed
    const blockIndex = await entityManager.findOne(BlockIndex, {
      where: { blockNumber: 1 },
    });
    expect(blockIndex).toBeNull();
  });

  it('should process and revert multiple blocks in correct order', async () => {
    // Process block 1
    await reorgService.processBlock(1, async () => {
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);
    });

    // Process block 2
    await reorgService.processBlock(2, async () => {
      await transactionService.storeEntity<B>({ value1: 30, value2: 40 }, B);
    });

    // Process block 3
    await reorgService.processBlock(3, async () => {
      // Update entity from block 1
      const entityA = await entityManager.findOne(A, {
        where: { value1: 10 },
      });
      if (entityA) {
        await transactionService.editEntity<A>(entityA.id, { value1: 15 }, A);
      }
    });

    // Verify all entities exist with correct values
    const entityA = await entityManager.findOne(A, { where: { value2: 20 } });
    expect(entityA?.value1).toBe(15); // Updated in block 3

    const entityB = await entityManager.findOne(B, { where: { value1: 30 } });
    expect(entityB).not.toBeNull();

    // Revert blocks in reverse order
    await reorgService.revertBlock(3);

    // Verify entity A is back to original value
    const entityAAfterRevert3 = await entityManager.findOne(A, {
      where: { value2: 20 },
    });
    expect(entityAAfterRevert3?.value1).toBe(10);

    await reorgService.revertBlock(2);

    // Verify entity B is gone
    const entityBAfterRevert = await entityManager.find(B);
    expect(entityBAfterRevert.length).toBe(0);

    await reorgService.revertBlock(1);

    // Verify all entities are gone
    const allEntitiesAfterRevert = await entityManager.find(A);
    expect(allEntitiesAfterRevert.length).toBe(0);
  });

  it('should handle transaction rollback on error during block processing', async () => {
    // Try to process a block with an error
    try {
      await reorgService.processBlock(1, async () => {
        // Create entity
        await entityManager.save(A, { value1: 10, value2: 20 });

        // Throw error to cause rollback
        throw new Error('Intentional error');
      });

      // Should not reach here
      expect(true).toBe(false); // Alternative to fail()
    } catch (error) {
      expect(error.message).toBe('Intentional error');
    }

    // Verify entity was not created (transaction rolled back)
    const entities = await entityManager.find(A);
    expect(entities.length).toBe(0);

    // Verify no block index was created
    const blockIndices = await entityManager.find(BlockIndex);
    expect(blockIndices.length).toBe(0);
  });

  it('should not process a block that already exists', async () => {
    // Process block 1
    await reorgService.processBlock(1, async () => {
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);
    });

    // Verify block exists in database
    const blockBeforeSecondAttempt = await entityManager.findOne(BlockIndex, {
      where: { blockNumber: 1 },
    });
    expect(blockBeforeSecondAttempt).not.toBeNull();

    // Try to process block 1 again - should throw an error
    let errorThrown = false;
    let errorMessage = '';

    try {
      await reorgService.processBlock(1, async () => {
        await transactionService.storeEntity<B>({ value1: 30, value2: 40 }, B);
      });
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    // Verify error was thrown with correct message
    expect(errorThrown).toBe(true);
    expect(errorMessage).toContain('Block 1 already exists');

    // Verify no B entities were created
    const entitiesB = await entityManager.find(B);
    expect(entitiesB.length).toBe(0);

    // Verify A entity still exists
    const entitiesA = await entityManager.find(A);
    expect(entitiesA.length).toBe(1);
  });

  it('should handle reverting a block that does not exist', async () => {
    // Try to revert non-existent block
    await reorgService.revertBlock(999);

    // This should not throw an error, but should have no effect
    // We can verify no blocks exist
    const blockIndices = await entityManager.find(BlockIndex);
    expect(blockIndices.length).toBe(0);
  });

  it('should handle reverting blocks in correct order', async () => {
    // Process blocks 1 and 2
    await reorgService.processBlock(1, async () => {
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);
    });

    await reorgService.processBlock(2, async () => {
      await transactionService.storeEntity<B>({ value1: 30, value2: 40 }, B);
    });

    // Verify both blocks exist
    const blocks = await entityManager.find(BlockIndex, {
      order: { blockNumber: 'ASC' },
    });
    expect(blocks.length).toBe(2);
    expect(blocks[0].blockNumber).toBe(1);
    expect(blocks[1].blockNumber).toBe(2);

    // Revert blocks in correct order (highest first)
    await reorgService.revertBlock(2);

    // Verify block 2 is gone but block 1 remains
    const blocksAfterRevert2 = await entityManager.find(BlockIndex);
    expect(blocksAfterRevert2.length).toBe(1);
    expect(blocksAfterRevert2[0].blockNumber).toBe(1);

    // Verify B entities are gone
    const entitiesBAfterRevert = await entityManager.find(B);
    expect(entitiesBAfterRevert.length).toBe(0);

    // Verify A entities still exist
    const entitiesAAfterRevert = await entityManager.find(A);
    expect(entitiesAAfterRevert.length).toBe(1);

    // Now revert block 1
    await reorgService.revertBlock(1);

    // Verify all blocks are gone
    const blocksAfterRevertAll = await entityManager.find(BlockIndex);
    expect(blocksAfterRevertAll.length).toBe(0);

    // Verify all entities are gone
    const entitiesAAfterRevertAll = await entityManager.find(A);
    expect(entitiesAAfterRevertAll.length).toBe(0);
  });
});
