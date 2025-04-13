import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  SQLTransactionService,
  SQLTransactionServiceIdentifier,
} from '../../sql-transaction-module/sql-transaction.service';
import { UndoOperation } from '../../sql-transaction-module/types';
import { InjectEntityManager } from '@nestjs/typeorm';

export const TransactionalBlockProcessorIdentifier =
  'TransactionalBlockProcessorIdentifier';

/**
 * Service for handling all block processing database queries as a single database transaction.
 * Will either fail or succeed as a whole. Supports both processing and reverting (re-org scenarios).
 */
@Injectable()
export class TransactionalBlockProcessor {
  private readonly logger = new Logger(TransactionalBlockProcessor.name);

  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @Inject(SQLTransactionServiceIdentifier)
    private transactionService: SQLTransactionService,
  ) {}

  /**
   * Process a block with transaction support
   * This method will be called by the block monitor to execute developer code within a transaction
   */
  async processBlock(blockNumber: number, callback: () => Promise<void>) {
    this.logger.log(`Starting to process block ${blockNumber}`);

    // Check if block already exists
    const existingBlock = await this.entityManager
      .getRepository('BlockIndex')
      .findOne({ where: { blockNumber } });

    if (existingBlock) {
      throw new Error(
        `Block ${blockNumber} already exists and cannot be processed again`,
      );
    }

    // Use the transaction method of EntityManager
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      this.logger.debug(`Transaction started for block ${blockNumber}`);

      this.transactionService.setTransactionEntityManager(
        transactionalEntityManager,
      );

      // Execute the callback that contains the developer's code
      await callback();

      const undoOps = this.transactionService.getUndoOperations();

      this.transactionService.resetUndoOperations();

      // Store the block processing result and undo operations in the database
      await transactionalEntityManager.getRepository('BlockIndex').save({
        blockNumber,
        processedAt: new Date(),
        undoOperations: JSON.stringify(undoOps),
      });

      this.logger.log(`All operations processed for block ${blockNumber}`);
      this.logger.debug(`Undo operations: ${JSON.stringify(undoOps)}`);

      return undoOps;
    });

    this.logger.debug(`Transaction committed for block ${blockNumber}`);
  }

  /**
   * Apply undo operations to revert a block
   */
  async revertBlock(blockNumber: number) {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      this.logger.log(`Transaction started for reverting block ${blockNumber}`);

      const undoOperations = await this.getUndoOperations(
        transactionalEntityManager,
        blockNumber,
      );

      this.logger.log(`Starting to revert block ${blockNumber}`);
      this.logger.log(
        `Undo operations to apply: ${JSON.stringify(undoOperations)}`,
      );

      // Process undo operations in reverse order
      for (let i = undoOperations.length - 1; i >= 0; i--) {
        const operation = undoOperations[i];

        this.logger.log(
          `Applying undo operation: ${JSON.stringify(operation)}`,
        );

        switch (operation.type) {
          case 'INSERT':
            // Undo a DELETE by inserting the original data
            this.logger.log(
              `Inserting data to undo DELETE: ${JSON.stringify(
                operation.data,
              )}`,
            );
            await transactionalEntityManager
              .getRepository(operation.entity)
              .save(operation.data);
            break;

          case 'UPDATE':
            // Undo an UPDATE by restoring the original data
            this.logger.log(
              `Updating data to undo UPDATE: ${JSON.stringify(operation.data)}`,
            );
            await transactionalEntityManager
              .getRepository(operation.entity)
              .update(operation.condition, operation.data);
            break;

          case 'DELETE':
            // Undo an INSERT by deleting the record
            this.logger.log(
              `Deleting data to undo INSERT: ${JSON.stringify(operation.data)}`,
            );
            await transactionalEntityManager
              .getRepository(operation.entity)
              .delete(operation.data);
            break;
        }
      }

      // Remove the block processing result and undo operations from the database
      await transactionalEntityManager
        .getRepository('BlockIndex')
        .delete({ blockNumber });

      this.logger.log(`All undo operations applied for block ${blockNumber}`);
    });

    this.logger.log(`Successfully reverted block ${blockNumber}`);
  }

  /**
   * Get undo operations for a specific block
   */
  async getUndoOperations(
    transactionalEntityManager: EntityManager,
    blockNumber: number,
  ): Promise<UndoOperation[]> {
    this.logger.log(`Getting undo operations for block ${blockNumber}`);

    const blockIndex = await transactionalEntityManager
      .getRepository('BlockIndex')
      .findOne({
        where: { blockNumber },
      });

    if (!blockIndex) {
      this.logger.log(`No block index found for block ${blockNumber}`);
      return [];
    }

    const undoOperations = JSON.parse(blockIndex.undoOperations);
    this.logger.log(
      `Retrieved undo operations for block ${blockNumber}: ${JSON.stringify(
        undoOperations,
      )}`,
    );

    return undoOperations;
  }
}
