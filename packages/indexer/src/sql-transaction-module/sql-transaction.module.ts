import { Global, Module } from '@nestjs/common';
import {
  SQLTransactionService,
  SQLTransactionServiceIdentifier,
} from './sql-transaction.service';

@Global()
@Module({
  providers: [
    {
      provide: SQLTransactionServiceIdentifier,
      useClass: SQLTransactionService,
    },
  ],
  exports: [SQLTransactionServiceIdentifier],
})
export class SQLTransactionModule {}
