import { createContext } from "react";
import { InjectionToken, Injector } from "@adi/core";

export const InjectorContext = createContext<Injector>(null);
export const COMPONENT_TOKEN = new InjectionToken();