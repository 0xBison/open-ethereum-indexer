import { UndoOperation } from '../../sql-transaction-module';

// Interface for block indexing result
export interface BlockIndexResult {
  blockNumber: number;
  success: boolean;
  undoOperations: UndoOperation[];
}
