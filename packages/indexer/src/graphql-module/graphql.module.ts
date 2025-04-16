import { Module, DynamicModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { createGenericEntityResolver } from './generic-entity.resolver.factory';
import { createCustomEntityResolver } from './custom-entity.resolver.factory';
import { entityRegistry } from '../generic-indexer-module/entity-registry';
import { BlockIndex } from '../database-module/core/BlockIndex.entity';
import { BlockIndexResolver } from './block.resolver';

@Module({})
export class GraphQLAppModule {
  static forRoot(config?: { disablePlayground?: boolean }): DynamicModule {
    const allEntities = entityRegistry.getAll();

    // Split entities into generic and custom
    const genericEntities = allEntities.filter((entity) => {
      const prototype = Object.getPrototypeOf(entity.prototype);
      return (
        prototype && prototype.constructor.name === 'BlockchainEventEntity'
      );
    });

    const customEntities = allEntities.filter((entity) => {
      const prototype = Object.getPrototypeOf(entity.prototype);
      return (
        !prototype || prototype.constructor.name !== 'BlockchainEventEntity'
      );
    });

    // Create resolvers for both types
    const genericResolvers = genericEntities.map((entity) => {
      const eventName = entity.name.replace('Entity', '');
      return createGenericEntityResolver(entity, eventName);
    });

    const customResolvers = customEntities.map((entity) => {
      const entityName = entity.name.replace('Entity', '');
      return createCustomEntityResolver(entity, entityName);
    });

    return {
      module: GraphQLAppModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          playground: !config?.disablePlayground,
        }),
        TypeOrmModule.forFeature([...allEntities, BlockIndex]),
      ],
      providers: [...genericResolvers, ...customResolvers, BlockIndexResolver],
      exports: [GraphQLModule],
    };
  }
}
