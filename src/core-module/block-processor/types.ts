import { UndoOperation } from 'core-module/sql-transaction';

// Interface for block indexing result
export interface BlockIndexResult {
  blockNumber: number;
  success: boolean;
  undoOperations: UndoOperation[];
}
