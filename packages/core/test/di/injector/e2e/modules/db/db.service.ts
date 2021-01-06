import { Injectable, Scope } from "../../../../../../src/di";

@Injectable({
  scope: Scope.SINGLETON,
})
export class DBService {
  private readonly items: { [type: string]: object[] } = {};

  getItems<T = object>(type: string): T[] {
    return this.items[type] as any as T[];
  }

  getItem<T = object>(id: number, type: string): T {
    return this.items[type] && this.items[type][id] as any as T;
  }

  addItem(obj: object, type: string): void {
    this.items[type] && this.items[type].push(obj);
  }

  removeItem(id: number, type: string): void {
    this.items[type] && (this.items[type] = this.items[type].splice(id, 1));
  }
}
