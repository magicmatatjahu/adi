import { Type } from "../interfaces";

export class ExecutionContext {
  constructor(
    private readonly type: string,
    private readonly args: any[],
    private readonly clazz: Type<any> = null,
    private readonly handler: Function = null,
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
