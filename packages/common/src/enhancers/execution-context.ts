import { ClassType } from "@adi/core";

export class ExecutionContext {
  constructor(
    public readonly type: string,
    public readonly args: any[],
    public readonly target: ClassType<any>,
    public readonly handler: Function,
  ) {}
}
