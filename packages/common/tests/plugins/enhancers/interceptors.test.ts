import { ADI, Injector, Injectable, Token } from "@adi/core";
import { enhancersPlugin, UseInterceptors, INTERCEPTORS } from "../../../src";

import type { Interceptor, ExecutionContext, NextInterceptor } from '../../../src';

describe('Enhancers plugin - interceptors', function () {
  const plugin = enhancersPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work', function() {
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foobar');
  });

  test('should work as injection item', function() {
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      {
        provide: 'bar',
        useValue: 'bar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      SimpleInterceptor3,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      {
        provide: 'a',
        useValue: 'a',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foobar');
  });

  test('should work with interceptors passed on class togerther with method interceptors', function() {
    @Injectable()
    class ClassInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'bar';
      }
    }

    @Injectable()
    class MethodInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + ' with class interceptor ';
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

    const injector = Injector.create([
      Service,
      ClassInterceptor,
      MethodInterceptor,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foo with class interceptor bar');
  });

  test('should work with multiple definition of interceptors', function() {
    @Injectable()
    class ClassInterceptor1 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'c1';
      }
    }

    @Injectable()
    class ClassInterceptor2 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'c2';
      }
    }

    @Injectable()
    class MethodInterceptor1 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'm1';
      }
    }

    @Injectable()
    class MethodInterceptor2 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return next() + 'm2';
      }
    }

    @UseInterceptors(ClassInterceptor2)
    @UseInterceptors(ClassInterceptor1)
    @Injectable()
    class Service {
      @UseInterceptors(MethodInterceptor2)
      @UseInterceptors(MethodInterceptor1)
      method() {
        return '0';
      }
    }

    const injector = Injector.create([
      Service,
      ClassInterceptor1,
      ClassInterceptor2,
      MethodInterceptor1,
      MethodInterceptor2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('0m1m2c1c2');
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleInterceptor1,
      SimpleInterceptor2,
      {
        provide: 'a',
        async useFactory() { return 'a' },
      }
    ]).init() as Injector;

    const service = await injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(await service.method()).toEqual('foobar');
  });

  test('should work with global interceptors', async function() {
    @Injectable()
    class GlobalInterceptor1 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return 'gloabl1 ' + next();
      }
    }

    @Injectable()
    class GlobalInterceptor2 implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return 'gloabl2 ' + next();
      }
    }

    @Injectable()
    class ClassInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return 'class ' + next();
      }
    }

    @Injectable()
    class MethodInterceptor implements Interceptor {
      intercept(_: ExecutionContext, next: NextInterceptor<string>) {
        return 'method ' + next();
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

    const injector = Injector.create([
      Service,
      ClassInterceptor,
      MethodInterceptor,
      {
        provide: INTERCEPTORS,
        useClass: GlobalInterceptor1,
      },
      {
        provide: INTERCEPTORS,
        useClass: GlobalInterceptor2,
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('gloabl1 gloabl2 class method foo');
  });
});
