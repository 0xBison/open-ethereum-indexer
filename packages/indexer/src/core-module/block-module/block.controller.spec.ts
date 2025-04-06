import { Test, TestingModule } from '@nestjs/testing';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';

describe('BlockController', () => {
  let controller: BlockController;
  let blockService: jest.Mocked<BlockService>;

  const mockBlock = {
    id: 1,
    blockNumber: 100,
    processedAt: new Date(),
    undoOperations: '',
  };

  const mockBlockResponse = {
    id: 1,
    blockNumber: 100,
    processedAt: mockBlock.processedAt.getTime(),
    undoOperations: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockController],
      providers: [
        {
          provide: BlockService,
          useValue: {
            getBlocks: jest.fn().mockResolvedValue([mockBlock]),
            getRecentBlocks: jest.fn().mockResolvedValue([mockBlock]),
          },
        },
      ],
    }).compile();

    controller = module.get<BlockController>(BlockController);
    blockService = module.get(BlockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBlocks', () => {
    it('should return blocks within range', async () => {
      const result = await controller.getBlocks({
        from: 99,
        to: 100,
      });
      expect(result).toEqual([mockBlockResponse]);
      expect(blockService.getBlocks).toHaveBeenCalledWith(99, 100, 1000);
    });

    it('should use custom limit when provided', async () => {
      const result = await controller.getBlocks({
        from: 99,
        to: 100,
        limit: 500,
      });
      expect(result).toEqual([mockBlockResponse]);
      expect(blockService.getBlocks).toHaveBeenCalledWith(99, 100, 500);
    });
  });

  describe('getRecentBlocks', () => {
    it('should return recent blocks with default limit', async () => {
      const result = await controller.getRecentBlocks({});
      expect(result).toEqual([mockBlockResponse]);
      expect(blockService.getRecentBlocks).toHaveBeenCalledWith(1000);
    });

    it('should return recent blocks with custom limit', async () => {
      const result = await controller.getRecentBlocks({ limit: 5 });
      expect(result).toEqual([mockBlockResponse]);
      expect(blockService.getRecentBlocks).toHaveBeenCalledWith(5);
    });
  });
});
