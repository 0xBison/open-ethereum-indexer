import { Test, TestingModule } from '@nestjs/testing';
import { BlockService } from './block.service';
import { BlockRepository } from './block.repository';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';

describe('BlockService', () => {
  let service: BlockService;
  let repository: jest.Mocked<BlockRepository>;

  const mockBlocks: BlockIndex[] = [
    {
      id: 1,
      blockNumber: 100,
      processedAt: new Date(),
      undoOperations: '',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: BlockRepository,
          useValue: {
            findBlocksInRange: jest.fn().mockResolvedValue(mockBlocks),
            findRecentBlocks: jest.fn().mockResolvedValue(mockBlocks),
          },
        },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
    repository = module.get(BlockRepository);
  });

  describe('getBlocks', () => {
    it('should return blocks within range', async () => {
      const result = await service.getBlocks(99, 100);
      expect(result).toEqual(mockBlocks);
      expect(repository.findBlocksInRange).toHaveBeenCalledWith(99, 100, 1000);
    });
  });

  describe('getRecentBlocks', () => {
    it('should return recent blocks', async () => {
      const result = await service.getRecentBlocks();
      expect(result).toEqual(mockBlocks);
      expect(repository.findRecentBlocks).toHaveBeenCalledWith(1000);
    });
  });
});
