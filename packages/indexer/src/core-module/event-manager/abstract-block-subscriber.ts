import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  EVENT_MANAGER_SERVICE,
  EventManagerService,
} from './event-manager.service';
import { LogContext } from './types';
import { BlockEvent } from '../../types';

@Injectable()
export abstract class AbstractBlockSubscriber implements OnModuleInit {
  @Inject(EVENT_MANAGER_SERVICE)
  protected eventManager: EventManagerService;

  // Optional methods with default implementations
  async onIndex(payload: BlockEvent, context: LogContext): Promise<void> {}
  async onDeindex(payload: BlockEvent, context: LogContext): Promise<void> {}

  onModuleInit() {
    this.eventManager.onBlock({
      onIndex: async (payload, context) => {
        await this.onIndex(payload, context);
      },
      onDeindex: async (payload, context) => {
        await this.onDeindex(payload, context);
      },
    });
  }
}
