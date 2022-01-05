import { Type } from "../interfaces";

export class ExecutionContext {
  constructor(
    private readonly type: string,
    private readonly args: any[],
    private readonly clazz: Type<any>,
    private readonly handler: Function,
  ) {}

  getType(): string {
    return this.type;
  }

  getClass<T = any>(): Type<T> {
    return this.clazz;
  }

  getHandler(): Function {
    return this.handler;
  }

  getArgs<T extends Array<any> = any[]>(): T;
  getArgs<T = any>(index?: number): T;
  getArgs(index?: number) {
    if (typeof index === 'number') {
      return this.args[index];
    } 
    return this.args;
  }
}

export function createExecutionContext(
  type: string,
  args: any[],
  clazz: Type<any> = null,
  handler: Function = null,
): ExecutionContext {
  return new ExecutionContext(type, args, clazz, handler);
}
