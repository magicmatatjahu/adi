export class NotFoundInjectorError extends Error {
  constructor() {
    super(`Injector context not found. Check if you have connected the ADI Module in the current component's VDOM parent tree.`)
  }
}
