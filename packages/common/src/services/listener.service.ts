import { ADI, injectableMixin } from '@adi/core';

import type { ADIEvents } from '@adi/core';

export class ListenerService {
  on<K extends keyof ADIEvents>(event: K, action: (data: ADIEvents[K]) => void) {
    return ADI.on(event, action);
  }
}

injectableMixin(ListenerService, { provideIn: ADI });
