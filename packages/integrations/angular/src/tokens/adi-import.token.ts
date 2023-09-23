import { InjectionToken } from '@angular/core';

import type { ModuleImportType } from '@adi/core';

export type AdiImport = ModuleImportType | { import: ModuleImportType, order?: number };

export const ADI_IMPORT = new InjectionToken<AdiImport>('adi.import');
