import { INJECTABLE_DEF } from '../constants';

import type { InjectableDef } from "../types";

export class DiscoveryService {
  static [INJECTABLE_DEF]: InjectableDef = {
    provideIn: 'core',
  };
}
