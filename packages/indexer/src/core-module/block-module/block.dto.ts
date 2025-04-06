import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';

export class GetBlocksDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  from?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  to?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Max(1000, { message: 'Cannot fetch more than 1000 blocks at once' })
  @Min(1)
  limit?: number = 1000;
}

export class BlockResponseDto {
  id: number;
  blockNumber: number;
  undoOperations: string;
  processedAt: number;

  constructor(block: BlockIndex) {
    this.id = block.id;
    this.blockNumber = block.blockNumber;
    this.undoOperations = block.undoOperations;
    this.processedAt = block.processedAt.getTime();
  }

  static fromEntity(block: BlockIndex): BlockResponseDto {
    return new BlockResponseDto(block);
  }
}
