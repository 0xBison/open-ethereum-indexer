import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import {
  EthereumHttpClient,
  EthereumHttpClientProviderIdentifier,
} from './ethereum-http-client';
import { HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '../config-module';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    {
      provide: EthereumHttpClientProviderIdentifier,
      useFactory: (httpService: HttpService, configService: ConfigService) => {
        return new EthereumHttpClient(
          httpService,
          configService.getConfig().network.rpcUrl,
        );
      },
      inject: [HttpService, ConfigService],
    },
  ],
  exports: [EthereumHttpClientProviderIdentifier],
})
export class EthereumClientModule {}
