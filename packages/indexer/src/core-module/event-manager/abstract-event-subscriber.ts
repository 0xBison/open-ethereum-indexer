import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  EVENT_MANAGER_SERVICE,
  EventManagerService,
} from './event-manager.service';
import { LogContext, LogEvent } from './types';

@Injectable()
export abstract class AbstractEventSubscriber implements OnModuleInit {
  @Inject(EVENT_MANAGER_SERVICE)
  protected eventManager: EventManagerService;

  abstract readonly eventPattern: string;

  // Optional methods with default implementations
  async onIndex(payload: LogEvent, context: LogContext): Promise<void> {}
  async onDeindex(payload: LogEvent, context: LogContext): Promise<void> {}

  onModuleInit() {
    this.eventManager.onEvent(this.eventPattern, {
      onIndex: async (payload, context) => {
        await this.onIndex(payload, context);
      },
      onDeindex: async (payload, context) => {
        await this.onDeindex(payload, context);
      },
    });
  }
}
