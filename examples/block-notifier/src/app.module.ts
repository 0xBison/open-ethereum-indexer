import { Module, Logger } from '@nestjs/common';
import { IndexerModule } from '@open-ethereum/indexer';
import { indexerConfig } from './indexer.config';
import { TelegramModule } from './telegram/telegram.module';
import { BlockNotifierService } from './subscriptions';

@Module({
  imports: [IndexerModule.forRoot(indexerConfig), TelegramModule],
  providers: [Logger, BlockNotifierService],
})
export class AppModule {}
