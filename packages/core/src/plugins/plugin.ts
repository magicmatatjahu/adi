import type { ADI } from "../adi";

export type InstallPlugin = (adi: ADI) => void;

export interface ADIPlugin<O = any> {
  name: string;
  install: (adi: ADI, options: O) => void;
}
