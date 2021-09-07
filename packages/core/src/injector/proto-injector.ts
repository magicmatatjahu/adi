import { Token } from "../types";
import { ProviderRecord } from "./provider";

export class ProtoInjector {
    // own records
    private readonly records = new Map<Token, ProviderRecord>();
    // records from imported modules
    private readonly importedRecords = new Map<Token, ProviderRecord>();
}