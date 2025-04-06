import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private readonly chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not set. Telegram notifications will be disabled.',
      );
      return;
    }

    if (!this.chatId) {
      this.logger.warn(
        'TELEGRAM_CHAT_ID not set. Telegram notifications will be disabled.',
      );
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      this.logger.log('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Telegram bot: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.bot || !this.chatId) {
      this.logger.debug(`Telegram notification skipped: ${message}`);
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, message);
      this.logger.log(`Telegram notification sent: ${message}`);
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram message: ${error.message}`,
        error.stack,
      );
    }
  }
}
