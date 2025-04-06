import { Injectable } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';

@Injectable()
export class BlockService {
  constructor(private readonly blockRepository: BlockRepository) {}

  async getBlocks(
    from?: number,
    to?: number,
    limit: number = 1000,
  ): Promise<BlockIndex[]> {
    return this.blockRepository.findBlocksInRange(from, to, limit);
  }

  async getRecentBlocks(limit: number = 1000): Promise<BlockIndex[]> {
    return this.blockRepository.findRecentBlocks(limit);
  }
}
