import { Global, Module } from '@nestjs/common';
import { AppController } from 'app.controller';
import { DatabaseModule } from 'database-module/database.module';
import { EthereumClientModule } from 'ethereum-client-module/ethereum-client.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CoreModule } from 'core-module/core.module';
import { ConfigModule } from 'config-module';
import { GenericIndexerModule } from 'generic-indexer-module/generic-indexer.module';
import { LoggerModule } from 'logger-module/logger.module';

import {
  onEvent,
  onBlock,
} from 'core-module/event-manager/event-manager.service';
import { GenericControllerModule } from 'generic-indexer-module/generic-controller.module';

// onEvent('*:*', {
//   onIndex: async (payload) => {
//     console.log('ON EVENT');
//   },
// });

// onBlock({
//   onIndex: async (payload) => {
//     console.log('ON BLOCK');
//   },
// });

const config = {
  network: {
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/',
    chainId: 1,
  },
  contracts: {},
};

@Global()
@Module({
  imports: [
    LoggerModule,
    ConfigModule.register(config),
    DatabaseModule.forRoot({
      entities: [],
      migrations: [],
    }),
    CoreModule,
    EthereumClientModule,
    PrometheusModule.register(),
    GenericIndexerModule.forRoot(),
    GenericControllerModule.forEntities(),
  ],
  controllers: [AppController],
})
export class AppModule {}
