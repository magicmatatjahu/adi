const notFoundInjectorMessage: string = `Injector context not found. Check if you have connected the ADI Module in the current component's VDOM parent tree.`;

export class NotFoundInjectorException extends Error {
  constructor() {
    super(notFoundInjectorMessage);
  }
}
