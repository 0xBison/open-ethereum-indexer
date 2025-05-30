import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericEventSubscriber } from './generic-event-subscriber';
import { BlockchainEventEntity } from './entity/BlockchainEventEntity';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { SQLTransactionModule } from '../sql-transaction-module';

// Export entities so they can be used by other modules
export const GENERIC_INDEXER_ENTITIES = [BlockchainEventEntity];

@Module({})
export class GenericIndexerModule {
  static forRoot(): DynamicModule {
    return {
      module: GenericIndexerModule,
      imports: [
        SQLTransactionModule,
        TypeOrmModule.forFeature(GENERIC_INDEXER_ENTITIES),
      ],
      providers: [
        GenericEventSubscriber,
        makeGaugeProvider({
          name: 'indexed_event',
          help: 'amount of events indexed or deindexed',
          labelNames: ['event_name'],
        }),
      ],
    };
  }
}
