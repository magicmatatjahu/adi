import { Injector, Injectable, UseMiddlewares, Interceptor, NextInterceptor, ExecutionContext, Middleware, Token } from "../../src";

describe('Middlewares', function() {
  test('should work as provider', function() {
    let called = false;

    @Injectable()
    class SimpleMiddleware implements Middleware {
      use(_: ExecutionContext, next) {
        called = true;
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(SimpleMiddleware)
      method() {}
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(called).toEqual(true);
  });

  test('should work as wrapper', function() {
    let called = false;

    @Injectable()
    class SimpleMiddleware implements Middleware {
      use(_: ExecutionContext, next) {
        called = true;
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(Token(SimpleMiddleware))
      method() {}
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(called).toEqual(true);
  });

  test('should work as instance of class', function() {
    let called = false;

    class SimpleMiddleware implements Middleware {
      use(_: ExecutionContext, next) {
        called = true;
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(new SimpleMiddleware())
      method() {}
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(called).toEqual(true);
  });

  test('should work as injection function', function() {
    let called = false;

    @Injectable()
    class Service {
      @UseMiddlewares({
        use(_, next, foobar) {
          if (foobar === 'foobar') {
            called = true;
          }
          return next();
        },
        inject: ['foobar'],
      })
      method() {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(called).toEqual(true);
  });

  test('should work with multiple middlewares', function() {
    const calledOrder = [];

    @Injectable()
    class SimpleMiddleware1 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('foobar');
        return next();
      }
    }

    @Injectable()
    class SimpleMiddleware2 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('foo');
        return next();
      }
    }

    @Injectable()
    class SimpleMiddleware3 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('barfoo');
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(SimpleMiddleware1, SimpleMiddleware2, SimpleMiddleware3)
      method() {}
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware1,
      SimpleMiddleware2,
      SimpleMiddleware3,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(calledOrder).toEqual(['foobar', 'foo', 'barfoo']);
  });

  test('should work with multiple middlewares (different types)', function() {
    const calledOrder = [];

    @Injectable()
    class SimpleMiddleware1 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('foobar');
        return next();
      }
    }

    @Injectable()
    class SimpleMiddleware2 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('barfoo');
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(
        SimpleMiddleware1,
        {
          use(_, next, foobar) {
            if (foobar === 'foobar') {
              calledOrder.push('foo')
            }
            return next();
          },
          inject: ['foobar'],
        },
        SimpleMiddleware2
      )
      method() {}
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware1,
      SimpleMiddleware2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(calledOrder).toEqual(['foobar', 'foo', 'barfoo']);
  });

  test('should work with middlewares passed on class togerther with method middlewares', function() {
    const calledOrder = [];

    @Injectable()
    class ClassMiddleware implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('class');
        return next();
      }
    }

    @Injectable()
    class MethodMiddleware implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('method');
        return next();
      }
    }

    @UseMiddlewares(ClassMiddleware)
    @Injectable()
    class Service {
      @UseMiddlewares(MethodMiddleware)
      method() {}
    }

    const injector = new Injector([
      Service,
      ClassMiddleware,
      MethodMiddleware,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method();
    expect(calledOrder).toEqual(['class', 'method']);
  });

  test('should return method result', function() {
    const calledOrder = [];

    @Injectable()
    class SimpleMiddleware1 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('foobar');
        return next();
      }
    }

    @Injectable()
    class SimpleMiddleware2 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('barfoo');
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(
        SimpleMiddleware1,
        {
          use(_, next, foobar) {
            if (foobar === 'foobar') {
              calledOrder.push('foo')
            }
            return next();
          },
          inject: ['foobar'],
        },
        SimpleMiddleware2
      )
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware1,
      SimpleMiddleware2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foobar');
    expect(calledOrder).toEqual(['foobar', 'foo', 'barfoo']);
  });

  test('should work with async resolution', async function() {
    const calledOrder = [];

    @Injectable()
    class SimpleMiddleware1 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('foobar');
        return next();
      }
    }

    @Injectable()
    class SimpleMiddleware2 implements Middleware {
      use(_: ExecutionContext, next) {
        calledOrder.push('barfoo');
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseMiddlewares(
        SimpleMiddleware1,
        {
          async use(_, next, foobar) {
            if (foobar === 'foobar') {
              calledOrder.push('foo')
            }
            return next();
          },
          inject: ['foobar'],
        },
        SimpleMiddleware2,
      )
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleMiddleware1,
      SimpleMiddleware2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(await service.method()).toEqual('foobar');
    expect(calledOrder).toEqual(['foobar', 'foo', 'barfoo']);
  });
});
