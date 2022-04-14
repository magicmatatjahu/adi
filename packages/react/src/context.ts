import { createContext } from "react";

import type { Injector } from "@adi/core";

export const InjectorContext = createContext<Injector>(null);
