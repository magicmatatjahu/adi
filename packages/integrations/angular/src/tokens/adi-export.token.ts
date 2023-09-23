import { InjectionToken } from '@angular/core';

import type { ModuleExportType } from '@adi/core';

export type AdiExport = ModuleExportType | { export: ModuleExportType, order?: number };

export const ADI_EXPORT = new InjectionToken<AdiExport>('adi.export');
