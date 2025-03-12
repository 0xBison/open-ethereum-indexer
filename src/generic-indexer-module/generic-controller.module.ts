import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createGenericEntityController } from './generic-entity.controller.factory';
import { entityRegistry } from './entity-registry';

@Module({})
export class GenericControllerModule {
  static forEntities(): DynamicModule {
    const allEntities = entityRegistry.getAll();

    // Filter entities that extend BlockchainEventEntity
    const blockchainEventEntities = allEntities.filter((entity) => {
      const prototype = Object.getPrototypeOf(entity.prototype);
      return (
        prototype && prototype.constructor.name === 'BlockchainEventEntity'
      );
    });

    // Create controllers for each entity
    const controllers = blockchainEventEntities.map((entity) => {
      // Extract entity name without the hash suffix (e.g., "Transfer" from "Transfer_ca44c4d7")
      const fullName = entity.name;
      const baseName = fullName.split('_')[0];

      console.log('baseName', baseName);
      console.log('fullName', entity);

      return createGenericEntityController(entity, baseName);
    });

    return {
      module: GenericControllerModule,
      imports: [TypeOrmModule.forFeature(blockchainEventEntities)],
      controllers,
    };
  }
}
