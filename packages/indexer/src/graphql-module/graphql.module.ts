import { Module, DynamicModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { createGenericEntityResolver } from './generic-entity.resolver.factory';
import { entityRegistry } from '../generic-indexer-module/entity-registry';

@Module({})
export class GraphQLAppModule {
  static forRoot(config?: { disablePlayground?: boolean }): DynamicModule {
    const allEntities = entityRegistry.getAll();

    const blockchainEventEntities = allEntities.filter((entity) => {
      const prototype = Object.getPrototypeOf(entity.prototype);
      return (
        prototype && prototype.constructor.name === 'BlockchainEventEntity'
      );
    });

    const resolvers = blockchainEventEntities.map((entity) => {
      const eventName = entity.name.replace('Entity', '');
      return createGenericEntityResolver(entity, eventName);
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
        TypeOrmModule.forFeature(blockchainEventEntities),
      ],
      providers: resolvers,
      exports: [GraphQLModule],
    };
  }
}
