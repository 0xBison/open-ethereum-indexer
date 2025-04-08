import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SQLTransactionService } from './sql-transaction.service';
import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import { A, B, C, BlockIndex, TestLogger } from './test/shared-test-utils';

describe('SQLTransactionService', () => {
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
        SQLTransactionService,
        {
          provide: Logger,
          useClass: TestLogger,
        },
      ],
    }).compile();

    transactionService = moduleRef.get<SQLTransactionService>(
      SQLTransactionService,
    );
    entityManager = moduleRef.get<EntityManager>(EntityManager);
  });

  it('should generate correct undo operations for storeEntity', async () => {
    await entityManager.transaction(async (transactionManager) => {
      // Set the transaction manager
      transactionService.setTransactionEntityManager(transactionManager);

      // Store entity
      const entity = await transactionService.storeEntity<A>(
        { value1: 10, value2: 20 },
        A,
      );

      // Get undo operations
      const undoOps = transactionService.getUndoOperations();

      // Verify undo operation was created
      expect(undoOps.length).toBe(1);
      expect(undoOps[0].type).toBe('DELETE'); // Fixed: uppercase
      expect(undoOps[0].entity).toBe('A');
      expect(undoOps[0].data).toEqual(
        expect.objectContaining({
          value1: 10,
          value2: 20,
        }),
      );
    });

    // Manually apply the undo operation to verify it works
    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // First, verify entity exists
      const entities = await transactionManager.find(A);
      expect(entities.length).toBe(1);

      // Get the undo operations from previous transaction
      const undoOps = transactionService.getUndoOperations();

      // Apply the undo operation (delete the entity)
      await transactionManager.delete(A, undoOps[0].data);

      // Verify entity was deleted
      const entitiesAfterUndo = await transactionManager.find(A);
      expect(entitiesAfterUndo.length).toBe(0);
    });
  });

  it('should generate correct undo operations for editEntity', async () => {
    // First create an entity
    let entityId: number;

    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Create initial entity
      const entity = await transactionManager.save(A, {
        value1: 10,
        value2: 20,
      });
      entityId = entity.id;

      // Edit the entity
      await transactionService.editEntity<A>(entityId, { value1: 30 }, A);

      // Get undo operations
      const undoOps = transactionService.getUndoOperations();

      // Verify undo operation was created correctly
      expect(undoOps.length).toBe(1);
      expect(undoOps[0].type).toBe('UPDATE'); // Fixed: uppercase
      expect(undoOps[0].entity).toBe('A');
      expect(undoOps[0].data).toEqual(
        expect.objectContaining({
          value1: 10,
          value2: 20,
        }),
      );

      // Verify entity was updated
      const updatedEntity = await transactionManager.findOne(A, {
        where: { id: entityId },
      });
      expect(updatedEntity?.value1).toBe(30);
      expect(updatedEntity?.value2).toBe(20);
    });

    // Manually apply the undo operation
    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Get undo operations from previous transaction
      const undoOps = transactionService.getUndoOperations();

      // Apply the undo operation (revert the edit)
      await transactionManager.update(A, entityId, undoOps[0].data);

      // Verify entity was reverted
      const revertedEntity = await transactionManager.findOne(A, {
        where: { id: entityId },
      });
      expect(revertedEntity?.value1).toBe(10);
      expect(revertedEntity?.value2).toBe(20);
    });
  });

  it('should generate correct undo operations for deleteEntity', async () => {
    // First create an entity
    let entityId: number;
    let originalEntity: any;

    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Create initial entity
      const entity = await transactionManager.save(A, {
        value1: 10,
        value2: 20,
      });
      entityId = entity.id;
      originalEntity = { ...entity };

      // Delete the entity
      await transactionService.deleteEntity<A>(entityId, A);

      // Get undo operations
      const undoOps = transactionService.getUndoOperations();

      // Verify undo operation was created correctly
      expect(undoOps.length).toBe(1);
      expect(undoOps[0].type).toBe('INSERT'); // Fixed: uppercase
      expect(undoOps[0].entity).toBe('A');
      expect(undoOps[0].data).toEqual(
        expect.objectContaining({
          value1: 10,
          value2: 20,
        }),
      );

      // Verify entity was deleted
      const deletedEntity = await transactionManager.findOne(A, {
        where: { id: entityId },
      });
      expect(deletedEntity).toBeNull();
    });

    // Manually apply the undo operation
    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Get undo operations from previous transaction
      const undoOps = transactionService.getUndoOperations();

      // Apply the undo operation (recreate the entity)
      await transactionManager.save(A, undoOps[0].data);

      // Verify entity was recreated
      const recreatedEntity = await transactionManager.findOne(A, {
        where: { id: entityId },
      });
      expect(recreatedEntity).not.toBeNull();
      expect(recreatedEntity?.value1).toBe(10);
      expect(recreatedEntity?.value2).toBe(20);
    });
  });

  it('should not commit changes until transaction is complete', async () => {
    // Start a transaction but don't complete it
    const runTransaction = entityManager
      .transaction(async (transactionManager) => {
        transactionService.setTransactionEntityManager(transactionManager);

        // Store entity
        await transactionService.storeEntity<A>({ value1: 50, value2: 60 }, A);

        // Verify entity exists within transaction
        const entitiesInTransaction = await transactionManager.find(A);
        expect(entitiesInTransaction.length).toBe(1);

        // Throw error to cause rollback
        throw new Error('Intentional rollback');
      })
      .catch((err) => {
        // We expect this error
        expect(err.message).toBe('Intentional rollback');
      });

    await runTransaction;

    // Verify entity doesn't exist outside transaction (rollback occurred)
    const entitiesAfterRollback = await entityManager.find(A);
    expect(entitiesAfterRollback.length).toBe(0);
  });

  it('should reset undo operations between transactions', async () => {
    // First transaction
    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Store entity
      await transactionService.storeEntity<A>({ value1: 10, value2: 20 }, A);

      // Verify undo operations
      const undoOps = transactionService.getUndoOperations();
      expect(undoOps.length).toBe(1);
    });

    // Reset the service manually
    transactionService.resetUndoOperations();

    // Second transaction
    await entityManager.transaction(async (transactionManager) => {
      transactionService.setTransactionEntityManager(transactionManager);

      // Verify undo operations are reset
      const undoOps = transactionService.getUndoOperations();
      expect(undoOps.length).toBe(0);

      // Store another entity
      await transactionService.storeEntity<B>({ value1: 30, value2: 40 }, B);

      // Verify new undo operation
      const newUndoOps = transactionService.getUndoOperations();
      expect(newUndoOps.length).toBe(1);
      expect(newUndoOps[0].entity).toBe('B');
    });
  });
});
