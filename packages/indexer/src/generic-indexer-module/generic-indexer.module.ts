import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  GenericEventLogIndexer,
  GenericEventLogIndexerIdentifier,
} from './generic-event-log-indexer';
import { GenericEventLogIndexerAdapter } from './generic-event-log-indexer-adapter';
import { BlockchainEventEntity } from './entity/BlockchainEventEntity';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { CoreModule } from '../core-module/core.module';
import { DatabaseModule } from '../database-module';

// Export entities so they can be used by other modules
export const GENERIC_INDEXER_ENTITIES = [BlockchainEventEntity];

@Module({})
export class GenericIndexerModule {
  static forRoot(): DynamicModule {
    return {
      module: GenericIndexerModule,
      imports: [
        TypeOrmModule.forFeature(GENERIC_INDEXER_ENTITIES),
        CoreModule, // Import CoreModule to get EVENT_MANAGER_SERVICE
      ],
      providers: [
        {
          provide: GenericEventLogIndexerIdentifier,
          useClass: GenericEventLogIndexer,
        },
        GenericEventLogIndexerAdapter,
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
