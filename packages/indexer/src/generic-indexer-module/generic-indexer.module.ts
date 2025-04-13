import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  GenericEventLogIndexer,
  GenericEventLogIndexerIdentifier,
} from './generic-event-log-indexer';
import { GenericEventSubscriber } from './generic-event-subscriber';
import { BlockchainEventEntity } from './entity/BlockchainEventEntity';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { SQLTransactionModule } from '../sql-transaction-module';
import { GenericBlockSubscriber } from '../../../../examples/wildcard-transfer/src/generic-block-subscriber';

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
        GenericBlockSubscriber,
        makeGaugeProvider({
          name: 'indexed_event',
          help: 'amount of events indexed or deindexed',
          labelNames: ['event_name'],
        }),
      ],
      exports: [GenericEventLogIndexerIdentifier],
    };
  }
}
