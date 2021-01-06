import { ContextAccessModifier } from "../enums";

export class Context<
  D extends Record<string, any> = Record<string, any>
> {
  constructor(
    private readonly data: D = {} as D,
    public readonly modifier: ContextAccessModifier = ContextAccessModifier.PUBLIC,
    private readonly name?: string,
  ) {}

  public getData(): D {
    return this.data;
  }

  public getKey<T = any>(key: string): T {
    return this.data[key];
  }

  public getAccessModifier(): ContextAccessModifier {
    return this.modifier;
  }

  public getName(): string {
    return this.name;
  }
}
