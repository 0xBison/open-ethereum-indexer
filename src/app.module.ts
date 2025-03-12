import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database-module/database.module';

@Global()
@Module({
  imports: [
    DatabaseModule.forRoot({
      entities: [],
      migrations: [],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
