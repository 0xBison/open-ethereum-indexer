import { entityRegistry } from '@open-ethereum/indexer';
import * as entities from './output/entities';

// Register all entities from the entities object
Object.keys(entities).forEach((key) => {
  const entity = entities[key];
  if (entity && typeof entity === 'function') {
    entityRegistry.registerGeneric(entity);
  } else {
    console.warn(`Skipping invalid entity export: ${key}`);
  }
});
