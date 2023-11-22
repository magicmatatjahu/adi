import { getGlobalThis } from "../utils";

import type { ADI } from "../adi";
import type { Injector } from "../injector/injector";
import type { EventKind, Events, EventContext, EventListener, EventListenerRef } from '../types';

export class EventEmitter {
  protected readonly adi: typeof ADI = getGlobalThis().$$adi;
  protected readonly listeners: Map<EventKind, Array<EventListener<any>>> = new Map();

  constructor(
    protected readonly injector: Injector,
  ) {}

  on<K extends EventKind>(event: K, listener: EventListener<K>): EventListenerRef {
    return on(this, event, listener);
  }

  emit<K extends EventKind>(event: K, payload: Events[K], ctx?: Omit<EventContext, 'injector'>): void {
    ctx = { ...ctx, injector: this.injector };
    this.adi.emit(event, payload, ctx as EventContext);
    emit(this, event, payload, ctx as EventContext);
  }

  emitAll<K extends EventKind>(event: K, payloads: Array<Events[K]>, ctx?: Omit<EventContext, 'injector'>): void {
    ctx = { ...ctx, injector: this.injector };
    this.adi.emitAll(event, payloads, ctx as EventContext);
    emitAll(this, event, payloads, ctx as EventContext);
  }
}

export function on<K extends EventKind>(emitter: any, event: K, listener: EventListener<K>): EventListenerRef {
  let listeners = emitter.listeners.get(event);
  if (listeners === undefined) {
    emitter.listeners.set(event, (listeners = []));
  }
  listeners.push(listener);

  const _listeners = emitter.listeners;
  return {
    unsubscribe() {
      const indexOf = listeners!.indexOf(listener);
      if (indexOf === -1) return;
      listeners!.splice(indexOf, 1);
      if (!listeners!.length) {
        _listeners.delete(event);
      }
    }
  }
}

export function emit<K extends EventKind>(emitter: { on<K extends EventKind>(event: K, listener: EventListener<K>): EventListenerRef }, event: K, payload: Events[K], ctx: EventContext): void {
  const listeners = (emitter as unknown as { listeners: Map<EventKind, Array<EventListener<any>>> }).listeners.get(event);
  if (listeners) {
    listeners.forEach(listener => listener(payload, ctx as EventContext));
  }
}

export function emitAll<K extends EventKind>(emitter: { on<K extends EventKind>(event: K, listener: EventListener<K>): EventListenerRef }, event: K, payloads: Array<Events[K]>, ctx: Omit<EventContext, 'injector'>): void {
  const listeners = (emitter as unknown as { listeners: Map<EventKind, Array<EventListener<any>>> }).listeners.get(event);
  if (listeners) {
    payloads.forEach(payload => listeners.forEach(listener => listener(payload, ctx as EventContext)));
  }
}
