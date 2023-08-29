import { ADI } from '../adi';

import { Injector } from './injector';
import { EventKind, Events, EventContext } from '../types';

export class EventEmitter {
  constructor(
    private injector: Injector,
  ) {}

  emit<K extends EventKind>(event: K, payload: Events[K], ctx: Omit<EventContext, 'injector'>): void {
    return ADI.emit(event, payload, { ...ctx, injector: this.injector });
  }

  emitAll<K extends EventKind>(event: K, payloads: Array<Events[K]>, ctx: EventContext): void {
    return ADI.emitAll(event, payloads, { ...ctx, injector: this.injector });
  }
}
