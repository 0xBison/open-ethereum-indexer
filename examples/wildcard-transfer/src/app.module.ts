import { Module } from '@nestjs/common';
import { IndexerModule } from '@open-ethereum/indexer';
import { indexerConfig } from './indexer.config';
import './subscriptions';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExampleEntity } from './custom/entities/ExampleEntity';
import { TransferSubscriber } from './transfer-subscriber';

@Module({
  imports: [
    IndexerModule.forRoot(indexerConfig),
    TypeOrmModule.forFeature([ExampleEntity]),
  ],
  providers: [TransferSubscriber],
})
export class AppModule {}
