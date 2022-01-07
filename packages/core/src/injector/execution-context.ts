import { Type } from "../interfaces";

export class ExecutionContext {
  static tryFromHost(
    args: any[] = [],
    clazz: Type<any>,
    handler: Function,
  ) {
    if (args[0] instanceof ExecutionContextHost) {
      return new ExecutionContext(args[0].type, args[0].args, clazz, handler);
    }
    return new ExecutionContext('default', args, clazz, handler);
  }

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

export class ExecutionContextHost {
  static create(
    type: string,
    args: any[],
  ) {
    return new ExecutionContextHost(type, args);
  }

  constructor(
    readonly type: string,
    readonly args: any[],
  ) {}
}
