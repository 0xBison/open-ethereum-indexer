import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'block_index' })
export class BlockIndex {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column({ name: 'block_number' })
  blockNumber: number;

  @Field()
  @Column({ name: 'processed_at' })
  processedAt: Date;

  // Intentionally not exposed to GraphQL
  @Column({ name: 'undo_operations', type: 'text' })
  undoOperations: string;
}
