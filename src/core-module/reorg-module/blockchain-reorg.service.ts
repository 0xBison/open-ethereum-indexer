import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BlockchainTransactionService } from './blockchain-transaction.service';

// Interface for undo operations
export interface UndoOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  condition?: any;
  originalData?: any;
}

// Interface for block indexing result
export interface BlockIndexResult {
  blockNumber: number;
  success: boolean;
  undoOperations: UndoOperation[];
}

/**
 * Service for handling blockchain reorganizations
 */
@Injectable()
export class BlockchainReorgService {
  private readonly logger = new Logger(BlockchainReorgService.name);

  constructor(
    private entityManager: EntityManager,
    private transactionService: BlockchainTransactionService,
  ) {}

  /**
   * Process a block with transaction support
   * This method will be called by the block monitor to execute developer code within a transaction
   */
  async processBlock(blockNumber: number, callback: () => Promise<void>) {
    this.logger.log(`Starting to process block ${blockNumber}`);

    // Use the transaction method of EntityManager
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      this.logger.log(`Transaction started for block ${blockNumber}`);

      this.transactionService.setTransactionEntityManager(
        transactionalEntityManager,
      );

      // Execute the callback that contains the developer's code
      await callback();

      const undoOps = this.transactionService.getUndoOperations();

      this.transactionService.resetUndoOperations();

      // Store the block result in the same transaction
      await this.storeBlockResult({
        blockNumber,
        success: true,
        undoOperations: undoOps,
      });

      this.logger.log(`All operations processed for block ${blockNumber}`);
      this.logger.log(`Undo operations: ${JSON.stringify(undoOps)}`);

      return undoOps;
    });

    this.logger.log(`Transaction committed for block ${blockNumber}`);
  }

  /**
   * Apply undo operations to revert a block
   */
  async revertBlock(blockNumber: number) {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      this.logger.log(`Transaction started for reverting block ${blockNumber}`);

      const undoOperations = await this.getUndoOperations(blockNumber);

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

      // Remove the block result in the same transaction
      await this.removeBlockResult(blockNumber);
      this.logger.log(`All undo operations applied for block ${blockNumber}`);
    });

    this.logger.log(`Successfully reverted block ${blockNumber}`);
  }

  /**
   * Remove block processing results including undo operations
   */
  async removeBlockResult(blockNumber: number) {
    this.logger.log(`Removing block result for block ${blockNumber}`);

    // Remove the block processing result and undo operations from the database
    await this.entityManager
      .getRepository('BlockIndex')
      .delete({ blockNumber });

    this.logger.log(`Removed block result for block ${blockNumber}`);
  }

  /**
   * Store block processing results including undo operations
   */
  async storeBlockResult(result: BlockIndexResult) {
    this.logger.log(`Storing block result for block ${result.blockNumber}`);

    // Store the block processing result and undo operations in the database
    await this.entityManager.getRepository('BlockIndex').save({
      blockNumber: result.blockNumber,
      processedAt: new Date(),
      undoOperations: JSON.stringify(result.undoOperations),
    });

    this.logger.log(`Stored block result for block ${result.blockNumber}`);
  }

  /**
   * Get undo operations for a specific block
   */
  async getUndoOperations(blockNumber: number): Promise<UndoOperation[]> {
    this.logger.log(`Getting undo operations for block ${blockNumber}`);

    const blockIndex = await this.entityManager
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
