const ExecutionContextArgumentsSymbol = Symbol('adi:execution-context-arguments');
const ExecutionContextArgumentSymbol = Symbol('adi:execution-context-argument');

export type ExecutionContextFactory<K extends keyof ExecutionContextKind = keyof ExecutionContextKind> = (type: K, data: ExecutionContextKind[K]) => ExecutionContext;
export type ExecutionContextArgument<K extends keyof ExecutionContextKind = keyof ExecutionContextKind> = {
  type: K,
  data: ExecutionContextKind[K];
  [ExecutionContextArgumentSymbol]: true;
}

export interface ExecutionContextKind {
  'adi:function-call': any[];
}

export interface ExecutionContextMetadata {
  target: Object;
  key: string | symbol;
  descriptor: PropertyDescriptor;
  static: boolean;
  reflectedTypes?: Array<any>;
}

// change it to the normal object, not class
export class ExecutionContext<K extends keyof ExecutionContextKind = keyof ExecutionContextKind> {
  static run<K extends keyof ExecutionContextKind = keyof ExecutionContextKind>(instance: any, method: () => any, type: K, data: ExecutionContextKind[K]) {
    const argument: ExecutionContextArgument = {
      type,
      data,
      [ExecutionContextArgumentSymbol]: true,
    }
    return method.apply(instance, [argument]);
  }
  
  public [ExecutionContextArgumentsSymbol]: any[];

  constructor(
    public readonly type: K,
    public readonly data: ExecutionContextKind[K],
    public readonly instance: any,
    public readonly metadata: ExecutionContextMetadata,
  ) {}
}

export function executionContextFactory(instance: any, metadata: ExecutionContextMetadata): ExecutionContextFactory {
  return function<K extends keyof ExecutionContextKind = keyof ExecutionContextKind>(type: K, data: ExecutionContextKind[K]) {
    return new ExecutionContext(type, data, instance, metadata);
  }
}

export function retrieveExecutionContextArguments(ctx: ExecutionContext): any[] {
  return ctx[ExecutionContextArgumentsSymbol];
}

export function setExecutionContextArguments(ctx: ExecutionContext, args: any[]): void {
  ctx[ExecutionContextArgumentsSymbol] = args;
}

export function isExecutionContextArgument(value: unknown): value is ExecutionContextArgument {
  return value && value[ExecutionContextArgumentSymbol] === true;
}
