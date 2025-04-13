import { Module } from '@nestjs/common';
import { IndexerModule } from '@open-ethereum/indexer';
import { indexerConfig } from './indexer.config';

@Module({
  imports: [IndexerModule.forRoot(indexerConfig)],
})
export class AppModule {}
