import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'block_index' })
export class BlockIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'block_number' })
  blockNumber: number;

  @Column({ name: 'processed_at' })
  processedAt: Date;

  @Column({ name: 'undo_operations', type: 'text' })
  undoOperations: string;
}
