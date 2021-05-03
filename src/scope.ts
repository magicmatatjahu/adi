import { Context } from "./injector";
import { DefinitionRecord, InjectionSession } from "./interfaces";
import { STATIC_CONTEXT } from "./constants";

export class Scope {
  public static DEFAULT: Scope = new Scope();

  public getContext<T = any>(
    def: DefinitionRecord<T>, 
    session?: InjectionSession,
  ): Context {
    return session?.options?.ctx || STATIC_CONTEXT;
  }

  // public toCache<T = any>(
  //   options: InjectionOptions,
  //   def: RecordDefinition<T>, 
  //   session?: InjectionSession,
  // ): boolean {
  //   return true;
  // }
}
