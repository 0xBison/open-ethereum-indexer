import { onBlock } from '@open-ethereum/indexer';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';

// Function to check if a block number is a millionth block
const isMillionthBlock = (blockNumber: number): boolean => {
  return blockNumber % 1_000_000 === 0;
};

// Create a global singleton for storing the TelegramService instance
class TelegramServiceProvider {
  private static instance: TelegramServiceProvider;
  private service: TelegramService | null = null;

  private constructor() {}

  static getInstance(): TelegramServiceProvider {
    if (!TelegramServiceProvider.instance) {
      TelegramServiceProvider.instance = new TelegramServiceProvider();
    }
    return TelegramServiceProvider.instance;
  }

  setService(service: TelegramService): void {
    this.service = service;
  }

  getService(): TelegramService | null {
    return this.service;
  }
}

// Service to handle dependency injection and registration with the provider
@Injectable()
export class BlockNotifierService implements OnModuleInit {
  private readonly logger = new Logger(BlockNotifierService.name);

  constructor(private telegramService: TelegramService) {}

  onModuleInit() {
    // Register the Telegram service with the provider
    TelegramServiceProvider.getInstance().setService(this.telegramService);
    this.logger.log('BlockNotifierService initialized with Telegram service');
  }
}

// Helper function to send a notification about a millionth block
async function notifyMillionthBlock(
  blockNumber: number,
  blockHash: string,
  timestamp: number,
): Promise<void> {
  const humanReadableTime = new Date(timestamp * 1000).toLocaleString();
  const message = `🎉 MILESTONE: Block ${blockNumber} detected!\nHash: ${blockHash}\nTime: ${humanReadableTime}`;

  console.log(message);

  const telegramService = TelegramServiceProvider.getInstance().getService();
  if (telegramService) {
    await telegramService.sendMessage(message);
  } else {
    console.warn('Telegram service not available for notification');
  }
}

// Register a handler for all block events
onBlock({
  onIndex: async (payload) => {
    const { number, hash, timestamp } = payload;

    // Check if this is a millionth block
    if (isMillionthBlock(number)) {
      await notifyMillionthBlock(number, hash, timestamp);
    } else if (number % 10 === 0) {
      // Log every 10th block for debugging
      const humanReadableTime = new Date(timestamp * 1000).toLocaleString();
      console.log(`Block ${number} processed at ${humanReadableTime}`);
      await notifyMillionthBlock(number, hash, timestamp);
    }
  },
});
