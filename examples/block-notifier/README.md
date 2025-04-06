# Block Notifier Example

This example demonstrates how to listen for specific block events - in this case, monitoring for blocks that are a multiple of 1,000,000 (millionth blocks) and sending notifications via Telegram.

## Features

- Connects to an Ethereum node via RPC
- Monitors incoming blocks
- Detects when a block number is a multiple of 1,000,000
- Sends a notification to a Telegram channel when a millionth block is found

## Setup

### Prerequisites

- Node.js v16+
- PNPM
- Postgres database
- Telegram Bot API token

### Telegram Bot Setup

1. Create a Telegram bot by talking to [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` to BotFather
   - Follow the instructions to create a new bot
   - Save the API token provided by BotFather

2. Create a channel or group for notifications
   - Add your bot to the channel/group as an admin
   - Get the chat ID by:
     - For a channel: Forward a message from your channel to [@userinfobot](https://t.me/userinfobot)
     - For a group: Send `/my_id @userinfobot` in the group

3. Configure environment variables
   - Copy `.env.example` to `.env`
   - Set `TELEGRAM_BOT_TOKEN` to your bot's API token
   - Set `TELEGRAM_CHAT_ID` to your channel or group ID

### Installation

```bash
# Install dependencies
pnpm install

# Build the application
pnpm run build

# Start the application
pnpm run start
```

## Configuration

Edit the `.env` file to configure:

- RPC endpoint for your Ethereum node
- Database connection details
- Port settings
- Telegram bot token and chat ID

## How It Works

The application uses the open-ethereum-indexer to:

1. Connect to an Ethereum node and subscribe to new blocks
2. For each new block, check if the block number is divisible by 1,000,000
3. If a millionth block is found, format a message with block details
4. Send the notification to the configured Telegram channel

The core logic is in the following files:

- `src/subscriptions.ts` - Contains the block event handler
- `src/telegram/telegram.service.ts` - Manages the Telegram bot connection

## Testing

You can test the notification system by temporarily modifying the `isMillionthBlock` function in `src/subscriptions.ts` to trigger on more frequent block numbers. 