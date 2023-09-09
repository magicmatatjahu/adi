export class NotFoundInjectorError extends Error {
  constructor() {
    super(`Injector context not found. Check if you have connected the ADI Module in the current component's VDOM parent tree.`)
  }
}

export class SuspenseError extends Error {
  constructor() {
    super(`Asynchronous injection is performed, but without enabled suspense. Please enable suspense or specify suspense key in injection annotations.`)
  }
}

export class InjectOutsideClassComponentError extends Error {
  constructor() {
    super(`inject() function is only supported inside constructor of React Class Component.`)
  }
}
