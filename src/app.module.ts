import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
@Global()
@Module({
  imports: [],
  controllers: [AppController],
})
export class AppModule {}
