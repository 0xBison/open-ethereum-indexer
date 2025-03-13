import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { UndoOperation } from './types';

export const SQLTransactionServiceIdentifier =
  'SQLTransactionServiceIdentifier';

/**
 * Developer-friendly service for safely storing, editing, and deleting entities
 * with undo protection
 */
@Injectable()
export class SQLTransactionService {
  private readonly logger = new Logger(SQLTransactionService.name);

  private entityManager: EntityManager;

  private undoOperations: UndoOperation[] = [];

  setTransactionEntityManager(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  getUndoOperations(): UndoOperation[] {
    return [...this.undoOperations];
  }

  resetUndoOperations() {
    this.undoOperations = [];
  }

  /**
   * Store a new entity with reorg protection
   */
  async storeEntity<T extends ObjectLiteral>(
    data: Partial<T>,
    entityClass: EntityTarget<T>,
  ): Promise<boolean> {
    const entityName = this.getEntityName(entityClass);

    try {
      // Store the entity
      const repository = this.entityManager.getRepository(entityName);
      const result = await repository.save(data);

      this.logger.log(
        `Stored ${entityName} with result: ${JSON.stringify(result)}`,
      );

      // Track the undo operation (DELETE)
      this.undoOperations.push({
        type: 'DELETE',
        entity: entityName,
        data: result,
      });

      this.logger.log(`Added DELETE undo operation for ${entityName}`);

      return true;
    } catch (error) {
      this.logger.error(`Error storing entity ${entityName}:`, error);
      return false;
    }
  }

  /**
   * Edit an existing entity with reorg protection
   */
  async editEntity<T extends ObjectLiteral>(
    id: number,
    data: Partial<T>,
    entityClass: EntityTarget<T>,
  ): Promise<boolean> {
    const entityName = this.getEntityName(entityClass);

    try {
      // Find the entity to get original data
      const repository = this.entityManager.getRepository(entityName);
      const entity = await repository.findOne({ where: { id } });

      if (!entity) {
        throw new Error(`Entity ${entityName} with ID ${id} not found`);
      }

      // Store original data for undo
      const originalData = { ...entity };

      this.logger.log(
        `Original data for ${entityName} with ID ${id}: ${JSON.stringify(
          originalData,
        )}`,
      );

      // Update the entity
      Object.assign(entity, data);
      await repository.save(entity);

      this.logger.log(`Updated ${entityName} with ID ${id}`);

      // Track the undo operation (UPDATE)
      this.undoOperations.push({
        type: 'UPDATE',
        entity: entityName,
        data: originalData,
        condition: { id },
      });

      this.logger.log(
        `Added UPDATE undo operation for ${entityName} with ID: ${id}`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error editing entity ${entityName}:`, error);
      return false;
    }
  }

  /**
   * Delete an existing entity with reorg protection
   */
  async deleteEntity<T extends ObjectLiteral>(
    id: number,
    entityClass: EntityTarget<T>,
  ): Promise<boolean> {
    const entityName = this.getEntityName(entityClass);

    try {
      // Find the entity to get original data for undo
      const repository = this.entityManager.getRepository(entityName);
      const entity = await repository.findOne({ where: { id } });

      if (!entity) {
        throw new Error(`Entity ${entityName} with ID ${id} not found`);
      }

      // Store original data for undo
      const originalData = { ...entity };

      this.logger.log(
        `Original data for ${entityName} with ID ${id}: ${JSON.stringify(
          originalData,
        )}`,
      );

      // Delete the entity
      await repository.delete(id);

      this.logger.log(`Deleted ${entityName} with ID ${id}`);

      // Track the undo operation (INSERT)
      this.undoOperations.push({
        type: 'INSERT',
        entity: entityName,
        data: originalData,
      });

      this.logger.log(
        `Added INSERT undo operation for ${entityName} with ID: ${id}`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error deleting entity ${entityName}:`, error);
      return false;
    }
  }

  /**
   * Helper method to get entity name from EntityTarget
   */
  private getEntityName<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
  ): string {
    if (typeof entity === 'string') {
      return entity;
    } else if (typeof entity === 'function') {
      return entity.name;
    } else {
      return entity.constructor.name;
    }
  }
}
