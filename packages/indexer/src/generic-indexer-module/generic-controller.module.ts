import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  createEntityController,
  createGenericEntityController,
} from './generic-entity.controller.factory';
import { entityRegistry } from './entity-registry';
import { EntityListController } from './entity-list.controller';

@Module({})
export class GenericControllerModule {
  static forEntities(): DynamicModule {
    const allEntitiesMap = entityRegistry.getEntitiesMap();

    const controllers: any[] = [];
    const entities: any[] = [];

    for (const [key, value] of allEntitiesMap.entries()) {
      // Create controllers for each entity
      // Cant actually do the below since name isn't unique...
      // Extract entity name without the hash suffix (e.g., "Transfer" from "Transfer_ca44c4d7")
      // const fullName = entity.name;
      // const baseName = fullName.split('_')[0];

      const entity = value.entity;

      // Remove Entity from the name
      const eventName = entity.name.replace('Entity', '');
      const isGeneric = value.isGeneric;

      controllers.push(createEntityController(entity, eventName));

      if (isGeneric) {
        controllers.push(createGenericEntityController(entity, eventName));
      }

      entities.push(entity);
    }

    return {
      module: GenericControllerModule,
      imports: [TypeOrmModule.forFeature(entities)],
      controllers: [...controllers, EntityListController],
    };
  }
}
