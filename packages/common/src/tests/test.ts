import { Injectable, Inject, createInjector, Context, Scope } from "@adi/core";

@Injectable({ scope: Scope.TRANSIENT })
class ServiceToInject {}

@Injectable({ scope: Scope.TRANSIENT })
class Service {
  public foobar: string = undefined;

  @Inject("service")
  public serviceProp: ServiceToInject;

  constructor(
    @Inject(ServiceToInject) public service: ServiceToInject,
  ) {}

  onInit() {
    this.foobar = "barfoo";
  }
}

const injector = createInjector([Service, ServiceToInject, {
  provide: "service",
  useFactory: (service: ServiceToInject) => {
    return service;
  },
  inject: [ServiceToInject],
}]);

// console.time();
// const serviceA = injector.resolveSync(Service, { ctx: new Context() });
// console.timeEnd();
// console.time();
// const serviceB = injector.resolveSync(Service, { ctx: new Context() });
// console.timeEnd();
// console.time();
// const serviceC = injector.resolveSync(Service, { ctx: new Context() });
// console.timeEnd();
// console.time();
// const serviceD = injector.resolveSync(Service, { ctx: new Context() });
// console.timeEnd();
// console.time();
// const serviceE = injector.resolveSync(Service, { ctx: new Context() });
// console.timeEnd();

// const fn = async () => {
//   console.time();
//   await injector.resolve(Service, { ctx: new Context() })
//   console.timeEnd();
//   console.time();
//   await injector.resolve(Service, { ctx: new Context() })
//   console.timeEnd();
//   console.time();
//   await injector.resolve(Service, { ctx: new Context() })
//   console.timeEnd();
//   console.time();
//   await injector.resolve(Service, { ctx: new Context() })
//   console.timeEnd();
//   console.time();
//   await injector.resolve(Service, { ctx: new Context() })
//   console.timeEnd();
// }
// fn()

// function traceMethodCalls(obj, params: any) {
//   let handler = {
//       get(target, propKey, receiver) {
//         // console.log(target)
//         const newTarget = { ...target, prop: "changed" }
//         const o = Object.assign(Object.create(target.constructor.prototype), { ...target, prop2: "changed" });
//         console.log(o)
//         const origMethod = target[propKey];
//         return function (...args) {
//           let result = origMethod.call(o, args);
//           // console.log(propKey + JSON.stringify(args)
//           //     + ' -> ' + JSON.stringify(result));
//           return result;
//         };
//       }
//   };
//   return new Proxy(obj, handler);
// }

function createHandler(params) {
  return {
    get(target, propKey) {
      const prop = target[propKey];
      if (typeof prop === "function") {
        return () => prop.apply(this.$$proxy, arguments);
      }
      // patch inline and deep `this` - actually it's not supported
      // console.log(prop === target)
      // if (prop === target) {
      //   return this.$$proxy;
      // }
      // undefined/null/false/0/"" is also a value :)
      if (params.hasOwnProperty(propKey)) {
        return params[propKey];
      }
      return prop;
    },
    $$proxy: undefined, 
  };
}

function traceMethodCalls<T>(obj: T, params: any): T {
  const handler = createHandler(params);
  return handler.$$proxy = new Proxy(obj, handler);
}

const d = {
  prop: "propFromD",
  get() {
    return this.prop;
  }
}

// singleton
class A {
  prop = d

  method() {
    // console.log(this.prop)
    this.anotherMethod();
  }

  anotherMethod() {
    this.aMethod();
  }

  aMethod() {
    console.log(this.prop.get())
  }
}

class B {
  context = "context";
  inlineSelf = this;
  self = {
    self: this,
    deepSelf: {
      self: this,
    }
  };

  c: A = traceMethodCalls(new A(), { prop: { get() { return "fromC" } } })

  constructor (public d: A = traceMethodCalls(new A(), { prop: { get() { return "fromD" } } })) {
    // this.a = traceMethodCalls(a);
  }

  method(params: any) {
    console.log(this.context);
    console.log(this.inlineSelf.context);
    console.log(this.self.self.context);
    console.log(this.self.deepSelf.self.context);
    const self = this;
    
    self.c.aMethod();
    self.inlineSelf.c.method();
    self.self.self.c.aMethod();
    self.self.deepSelf.self.c.aMethod();

    self.d.method();
    self.inlineSelf.d.method();
    self.self.self.d.method();
    self.self.deepSelf.self.d.method();
  }

  dupa() {}
}

const b = new B();
const proxy = traceMethodCalls(b, { context: "changedContext" });
// console.log(proxy instanceof B);

proxy.method("check");


// console.time();
// b.method("check");
// console.timeEnd();
// console.time();
// b.method("check");
// console.timeEnd();
// console.time();
// b.method("check");
// console.timeEnd();
// console.time();
// b.method("check");
// console.timeEnd();
// console.time();
// b.method("check");
// console.timeEnd();


// console.time();
// proxy.method("check");
// console.timeEnd();
// console.time();
// proxy.method("check");
// console.timeEnd();
// console.time();
// proxy.method("check");
// console.timeEnd();
// console.time();
// proxy.method("check");
// console.timeEnd();
// console.time();
// proxy.method("check");
// console.timeEnd();

class AnotherRequestService {
  prop = 0;

  constructor(
    public value,
  ) {
  }

  method() {
    this.prop++;
    console.log(this instanceof AnotherRequestService)
    return this.value;
  }
}

const singletonRequest = new AnotherRequestService("singleton");

class Singleton {
  service = singletonRequest;
  increment = 0;

  method () {
    this.increment++;
    console.log(this.service)
    // setTimeout(() => {
    //   console.log(this.service)
    // }, 500);
    return this.service.method();
  }
}

class Transient {
  constructor(
    public singleton: Singleton,
  ) {}
}

const singleton = new Singleton();

const requestRequest = new AnotherRequestService("request");

class Request {
  constructor(
    public transient: Transient = new Transient(
      traceMethodCalls(singleton, { service: requestRequest })
    ),
  ) {}
}

// const r = new Request()
// console.log(r.transient.singleton.method())
// console.log(r.transient.singleton.method())
// console.log(r.transient.singleton.increment)
// console.log("prop from singletonRequest: ", singletonRequest.prop)
// console.log("prop from requestRequest: ", requestRequest.prop)
// console.log(singleton.increment);

// class LazyInject {
//   prop: undefined
// }

// function props() {
//   return {
//     get() {
//       console.log(this);
//       return "lol";
//     }
//   }
// }

// const l = new LazyInject();
// Object.defineProperty(l, "prop", props());

// console.log(l.prop)
