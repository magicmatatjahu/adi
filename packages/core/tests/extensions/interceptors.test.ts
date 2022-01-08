import { Injector, Injectable, UseInterceptors, Interceptor, NextInterceptor, ExecutionContext, Token } from "../../src";

describe('Interceptors', function() {
  test('should work as provider', function() {
    @Injectable()
    class SimpleInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        const result = next();
        return result + 'bar';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(SimpleInterceptor)
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work as wrapper', function() {
    @Injectable()
    class SimpleInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        const result = next();
        return result + 'bar';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(Token(SimpleInterceptor))
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work as instance of class', function() {
    class SimpleInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        const result = next();
        return result + 'bar';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(new SimpleInterceptor())
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work as injection function', function() {
    @Injectable()
    class Service {
      @UseInterceptors({
        intercept(_, next, bar) { return next() + bar },
        inject: ['bar'],
      })
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      {
        provide: 'bar',
        useValue: 'bar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work with multiple interceptors', function() {
    @Injectable()
    class SimpleInterceptor1 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'r';
      }
    }

    @Injectable()
    class SimpleInterceptor2 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'a';
      }
    }

    @Injectable()
    class SimpleInterceptor3 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'b';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(SimpleInterceptor1, SimpleInterceptor2, SimpleInterceptor3)
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      SimpleInterceptor3,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work with multiple interceptors (different types)', function() {
    @Injectable()
    class SimpleInterceptor1 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'r';
      }
    }

    @Injectable()
    class SimpleInterceptor2 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'b';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(
        SimpleInterceptor1,
        {
          intercept(_, next, a) { return next() + a },
          inject: ['a'],
        },
        SimpleInterceptor2
      )
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      {
        provide: 'a',
        useValue: 'a',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work with interceptors passed on class togerther with method interceptors', function() {
    @Injectable()
    class ClassInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + ' with class interceptor';
      }
    }

    @Injectable()
    class MethodInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'bar';
      }
    }

    @UseInterceptors(ClassInterceptor)
    @Injectable()
    class Service {
      @UseInterceptors(MethodInterceptor)
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      ClassInterceptor,
      MethodInterceptor,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar with class interceptor');
  });

  test('should work with async intercept functions', async function() {
    @Injectable()
    class SimpleInterceptor1 implements Interceptor {
      async intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return await next() + 'r';
      }
    }

    @Injectable()
    class SimpleInterceptor2 implements Interceptor {
      async intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return await next() + 'b';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(
        SimpleInterceptor1,
        {
          async intercept(_, next) { return await next() + 'a' },
        },
        SimpleInterceptor2,
      )
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method()).toEqual('foobar');
  });

  test('should work with async resolution', async function() {
    @Injectable()
    class SimpleInterceptor1 implements Interceptor {
      async intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return await next() + 'r';
      }
    }

    @Injectable()
    class SimpleInterceptor2 implements Interceptor {
      async intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return await next() + 'b';
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(
        SimpleInterceptor1,
        {
          async intercept(_, next, a) { return await next() + a },
          inject: ['a'],
        },
        SimpleInterceptor2,
      )
      method() {
        return 'foo';
      }
    }

    const injector = new Injector([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      {
        provide: 'a',
        async useFactory() { return 'a' },
      }
    ]);
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method()).toEqual('foobar');
  });
});
