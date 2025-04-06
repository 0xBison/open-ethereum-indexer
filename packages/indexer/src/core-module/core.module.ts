import { Logger, Module } from '@nestjs/common';
import { EthereumClientModule } from '../ethereum-client-module/ethereum-client.module';
import {
  BlockMonitorService,
  BlockMonitorServiceIdentifier,
} from './block-monitor/block-monitor.service';
import {
  BlockProcessorService,
  BlockProcessorServiceIdentifier,
} from './block-processor/block-processor';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import * as client from 'prom-client';
import { JsonStoreModule } from 'nest-json-store';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { CoreConfig } from './core.config';
import {
  EventParser,
  EventParserIdentifier,
} from './block-processor/event-parser';
import {
  EVENT_MANAGER_SERVICE,
  EventManagerService,
} from './event-manager/event-manager.service';
import { BlockMonitorController } from './block-monitor/block-monitor.controller';
import {
  SQLTransactionService,
  SQLTransactionServiceIdentifier,
} from './sql-transaction';
import {
  TransactionalBlockProcessor,
  TransactionalBlockProcessorIdentifier,
} from './block-processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsonStoreEntity } from 'nest-json-store';

// Metrics configuration
const metrics = [
  makeGaugeProvider({
    name: 'block_number',
    help: 'current block number',
  }),
  makeGaugeProvider({
    name: 'latest_indexed_block_number',
    help: 'latest indexed block number',
  }),
  makeGaugeProvider({
    name: 'latest_indexed_block_timestamp',
    help: 'the timestamp of the latest indexed block',
  }),
  makeCounterProvider({
    name: 'reorgs',
    help: 'amount of reorgs that occurred',
  }),
  makeCounterProvider({
    name: 'indexed_blocks',
    help: 'amount of blocks ran through the indexing flow',
  }),
  makeHistogramProvider({
    name: 'logs_count_per_block_range',
    help: 'amount of logs per block range',
    labelNames: ['block_range'],
    buckets: client.linearBuckets(0, 10, 40),
  }),
  makeHistogramProvider({
    name: 'logs_count_per_block',
    help: 'amount of logs per block',
    buckets: client.linearBuckets(0, 2, 25),
  }),
  makeHistogramProvider({
    name: 'block_process_iteration_duration',
    help: 'time it took to process the events from one block',
    buckets: client.exponentialBuckets(1, 2, 10),
  }),
];

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: CoreConfig,
      load: dotenvLoader({
        envFilePath:
          process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : '.env',
      }),
    }),
    TypeOrmModule.forFeature([JsonStoreEntity]),
    EthereumClientModule,
    JsonStoreModule,
  ],
  providers: [
    {
      provide: SQLTransactionServiceIdentifier,
      useClass: SQLTransactionService,
    },
    {
      provide: TransactionalBlockProcessorIdentifier,
      useClass: TransactionalBlockProcessor,
    },
    {
      provide: BlockMonitorServiceIdentifier,
      useClass: BlockMonitorService,
    },
    {
      provide: BlockProcessorServiceIdentifier,
      useClass: BlockProcessorService,
    },
    {
      provide: EventParserIdentifier,
      useClass: EventParser,
    },
    {
      provide: EVENT_MANAGER_SERVICE,
      useClass: EventManagerService,
    },
    Logger,
    ...metrics,
  ],
  controllers: [BlockMonitorController],
  exports: [
    EVENT_MANAGER_SERVICE,
    EventParserIdentifier,
    BlockProcessorServiceIdentifier,
    BlockMonitorServiceIdentifier,
  ],
})
export class CoreModule {}
