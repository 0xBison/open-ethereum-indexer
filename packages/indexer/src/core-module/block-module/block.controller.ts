import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlockService } from './block.service';
import { BlockResponseDto, GetBlocksDto } from './block.dto';

@ApiTags('Blocks')
@Controller('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  /**
   * Fetch blocks within a specified range
   * @param from Optional starting block number
   * @param to Optional ending block number
   * @returns Array of blocks within the specified range
   */
  @Get()
  public async getBlocks(
    @Query() query: GetBlocksDto,
  ): Promise<BlockResponseDto[]> {
    const blocks = await this.blockService.getBlocks(
      query.from,
      query.to,
      query.limit ?? 1000,
    );
    return blocks.map(BlockResponseDto.fromEntity);
  }

  /**
   * Fetch the most recent blocks
   * @param limit Optional number of blocks to return (default: 10)
   * @returns Array of most recent blocks
   */
  @Get('/recent')
  public async getRecentBlocks(
    @Query() query: GetBlocksDto,
  ): Promise<BlockResponseDto[]> {
    const blocks = await this.blockService.getRecentBlocks(query.limit ?? 1000);
    return blocks.map(BlockResponseDto.fromEntity);
  }
}
