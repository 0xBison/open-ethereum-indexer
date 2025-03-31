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
      // Cant actually do the below since name isn't unique...
      // Extract entity name without the hash suffix (e.g., "Transfer" from "Transfer_ca44c4d7")
      // const fullName = entity.name;
      // const baseName = fullName.split('_')[0];

      // Remove Entity from the name
      const eventName = entity.name.replace('Entity', '');

      return createGenericEntityController(entity, eventName);
    });

    return {
      module: GenericControllerModule,
      imports: [TypeOrmModule.forFeature(blockchainEventEntities)],
      controllers,
    };
  }
}
