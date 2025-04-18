# Block Notifier Example

This example demonstrates how to listen for specific block events - in this case, monitoring for blocks that are a multiple of 1,000,000 (millionth blocks) and sending notifications via Telegram.

- Connects to an Ethereum node via RPC
- Monitors incoming blocks
- Detects when a block number is a multiple of 1,000,000
- Sends a notification to a Telegram channel when a millionth block is found

You can see an example of a telegram channel with some test block notifications [here](https://t.me/ethereum_million_blocks).

## Project Purpose

The Block Notifier monitors the blockchain for "millionth blocks" (blocks whose number is a multiple of 1,000,000) and sends a notification to a Telegram channel when such a block is found. This could be adapted for various monitoring use cases, such as:

- Monitoring for specific types of transactions
- Alerting when certain contract events occur

## Project Structure

```
block-notifier/
├── src/
│   ├── app.module.ts         # Main application module
│   ├── indexer.config.ts     # Indexer configuration
│   ├── main.ts               # Application entry point
│   ├── subscriptions.ts      # Block event subscriptions
│   └── telegram/             # Telegram integration
│       ├── telegram.module.ts
│       └── telegram.service.ts
├── package.json
└── .env                      # Environment variables
```

## Telegram Integration

The example utilizes a Telegram bot to send notifications. Here's how the Telegram service is implemented:

```typescript
// src/telegram/telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;

    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        'Telegram bot token or chat ID not provided. Notifications will not be sent.',
      );
    } else {
      this.logger.log('Telegram service initialized');
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      this.logger.warn('Cannot send message: missing bot token or chat ID');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
      });
      this.logger.log('Telegram notification sent successfully');
    } catch (error) {
      this.logger.error('Failed to send Telegram notification', error);
    }
  }
}
```

## Block Monitoring

The core of this example is the block monitoring logic:

```typescript
// src/subscriptions.ts
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
    }
  },
});
```

## Application Module

The application module integrates all components:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { IndexerModule } from '@open-ethereum/indexer';
import { indexerConfig } from './indexer.config';
import { TelegramModule } from './telegram/telegram.module';
import { BlockNotifierService } from './subscriptions';
import './subscriptions';

@Module({
  imports: [IndexerModule.forRoot(indexerConfig), TelegramModule],
  providers: [BlockNotifierService],
})
export class AppModule {}
```

## Configuration

The configuration is similar to the basic example but focuses on block monitoring:

```typescript
// src/indexer.config.ts
import { IndexerConfig } from '@open-ethereum/indexer';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
    },
    contracts: {},
  },
  database: {
    migrations: [],
  },
  app: {
    disableMetrics: true,
  },
};
```

## Setting Up the Telegram Bot

Before running the example, you need to set up a Telegram bot:

1. Start a chat with [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions to create a new bot
3. Save the API token provided by BotFather
4. Create a channel or group for notifications
5. Add your bot to the channel/group as an admin
6. Get the chat ID:
   - For a channel: Forward a message from your channel to [@userinfobot](https://t.me/userinfobot)
   - For a group: Send `/my_id @userinfobot` in the group

## Running the Example

To run the block notifier example:

1. Set up your environment variables:

```
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
SQL_DB=block_notifier
SQL_USERNAME=postgres
SQL_PASSWORD=your-password
SQL_HOST=localhost
SQL_PORT=5432
PORT=3050
METRICS_PORT=3051
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm run start:dev
```

## Testing the Notification System

Since millionth blocks are rare, you might want to modify the `isMillionthBlock` function for testing:

```typescript
// For testing: trigger notifications more frequently
const isMillionthBlock = (blockNumber: number): boolean => {
  return blockNumber % 10 === 0; // Notify every 10 blocks
};
```

## Key Concepts Demonstrated

This example demonstrates several important concepts:

1. **Block Monitoring**: How to set up handlers to react to new blocks
2. **External Service Integration**: Connecting to third-party services (Telegram)
3. **Dependency Injection**: Using NestJS's DI system with the indexer
4. **Service Provider Pattern**: Creating a global singleton for accessing services from static handlers

## Extending the Example

You could extend this example in several ways:

- Monitor for specific transactions or contract events instead of block numbers
- Store notification history in the database
- Add a web dashboard to view notification history
- Support multiple notification channels (email, Discord, Slack, etc.)
- Configure different notification criteria through a web interface
