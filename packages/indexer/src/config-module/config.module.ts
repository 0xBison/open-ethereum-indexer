import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { Config } from './types';

@Global()
@Module({})
export class ConfigModule {
  static register(config: Config): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG',
          useValue: config,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
