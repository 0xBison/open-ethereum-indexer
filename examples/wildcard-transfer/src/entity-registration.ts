import { entityRegistry } from '@open-ethereum/indexer';
import { TransferEntity_fab013d9 } from './output/entities/TransferEntity_fab013d9';
import { ExampleEntity } from './custom/entities/ExampleEntity';

export const entities = [ExampleEntity];
export const genericEntities = [TransferEntity_fab013d9];

// Register all entities from the entities object
Object.keys(entities).forEach((key) => {
  const entity = entities[key];
  if (entity && typeof entity === 'function') {
    entityRegistry.register(entity);
  } else {
    console.warn(`Skipping invalid entity export: ${key}`);
  }
});

// Register all generic entities from the entities object
Object.keys(genericEntities).forEach((key) => {
  const entity = genericEntities[key];
  if (entity && typeof entity === 'function') {
    entityRegistry.registerGeneric(entity);
  } else {
    console.warn(`Skipping invalid entity export: ${key}`);
  }
});
