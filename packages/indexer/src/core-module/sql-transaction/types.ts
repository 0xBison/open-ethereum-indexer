// Interface for undo operations
export interface UndoOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  condition?: any;
  originalData?: any;
}
