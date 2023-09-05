import { ADI, Injector, Injectable, Token } from "@adi/core";
import { enhancersPlugin, EXCEPTION_HANDLERS, NextExceptionHandler, UseExceptionHandlers } from "../../../src";

import type { ExecutionContext, ExceptionHandler } from '../../../src';

describe.skip('Enhancers plugin - interceptors', function () {
  const plugin = enhancersPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work', function() {
    let called = false;

    @Injectable()
    class SimpleExceptionHandler implements ExceptionHandler {
      catch(error: unknown, _: ExecutionContext) {
        if (error instanceof Error) {
          called = true;
        }
        return 'error';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(SimpleExceptionHandler)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('error');
    expect(called).toEqual(true);
  });

  test('should work - rethrown error', function() {
    let called = false;

    @Injectable()
    class SimpleExceptionHandler implements ExceptionHandler {
      catch(error: unknown, _: ExecutionContext) {
        if (error instanceof Error) {
          called = true;
          throw error;
        }
        return 'error';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(SimpleExceptionHandler)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(() => service.method()).toThrow();
    expect(called).toEqual(true);
  });

  test('should work as injection item', function() {
    let called = false;

    @Injectable()
    class SimpleExceptionHandler implements ExceptionHandler {
      catch(error: unknown, _: ExecutionContext) {
        if (error instanceof Error) {
          called = true;
        }
        return 'error';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(Token(SimpleExceptionHandler))
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('error');
    expect(called).toEqual(true);
  });

  test('should work as instance of class', function() {
    let called = false;

    class SimpleExceptionHandler implements ExceptionHandler {
      catch(error: unknown) {
        if (error instanceof Error) {
          called = true;
        }
        return 'error';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(new SimpleExceptionHandler())
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('error');
    expect(called).toEqual(true);
  });

  test('should work as injection function', function() {
    let called = false;

    @Injectable()
    class Service {
      @UseExceptionHandlers({
        catch(error: unknown, ctx, next, foobar: string) {
          if (error instanceof Error) {
            called = true;
            return foobar;
          }
        },
        inject: ['foobar'],
      })
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foobar');
    expect(called).toEqual(true);
  });

  test('should work with multiple exception handlers', function() {
    @Injectable()
    class SimpleExceptionHandler1 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'error1' +  next();
      }
    }

    @Injectable()
    class SimpleExceptionHandler2 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'error2' +  next();
      }
    }

    @Injectable()
    class SimpleExceptionHandler3 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'error3';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(SimpleExceptionHandler1, SimpleExceptionHandler2, SimpleExceptionHandler3)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler1,
      SimpleExceptionHandler2,
      SimpleExceptionHandler3,
    ]).init() as Injector;
    
    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('error1error2error3');
  });

  test('should work with multiple exception handlers (different types)', function() {
    @Injectable()
    class SimpleExceptionHandler1 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'error1' +  next();
      }
    }

    @Injectable()
    class SimpleExceptionHandler2 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'error2';
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(
        SimpleExceptionHandler1,
        {
          catch(error, ctx, next) {
            return 'inline' +  next();
          },
        },
        SimpleExceptionHandler2,
      )
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler1,
      SimpleExceptionHandler2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('error1inlineerror2');
  });

  test('should work with exception handlers passed on class togerther with method exception handlers', function() {
    @Injectable()
    class ClassExceptionHandler implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'class' + next();
      }
    }

    @Injectable()
    class MethodExceptionHandler implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'method';
      }
    }

    @UseExceptionHandlers(ClassExceptionHandler)
    @Injectable()
    class Service {
      @UseExceptionHandlers(MethodExceptionHandler)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      ClassExceptionHandler,
      MethodExceptionHandler,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('classmethod');
  });

  test('should work with multiple definition of exception handlers', function() {
    @Injectable()
    class ClassExceptionHandler1 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'class1' + next();
      }
    }

    @Injectable()
    class ClassExceptionHandler2 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'class2' + next();
      }
    }

    @Injectable()
    class MethodExceptionHandler2 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'method2' + next();
      }
    }

    @Injectable()
    class MethodExceptionHandler1 implements ExceptionHandler {
      catch(error: unknown, ctx, next) {
        return 'method1'
      }
    }

    @UseExceptionHandlers(ClassExceptionHandler1)
    @UseExceptionHandlers(ClassExceptionHandler2)
    @Injectable()
    class Service {
      @UseExceptionHandlers(MethodExceptionHandler2)
      @UseExceptionHandlers(MethodExceptionHandler1)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      ClassExceptionHandler1,
      ClassExceptionHandler2,
      MethodExceptionHandler1,
      MethodExceptionHandler2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('class1class2method2method1');
  });

  test('should work with async canPerform functions', async function() {
    @Injectable()
    class SimpleExceptionHandler1 implements ExceptionHandler {
      async catch(error: unknown, ctx, next) {
        return 'error1' + await next();
      }
    }

    @Injectable()
    class SimpleExceptionHandler2 implements ExceptionHandler {
      async catch(error: unknown, ctx, next) {
        return 'error2'
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(
        SimpleExceptionHandler1,
        {
          async catch(error: unknown, ctx, next) {
            return 'inline' + await next();
          }
        },
        SimpleExceptionHandler2,
      )
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler1,
      SimpleExceptionHandler2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(await service.method()).toEqual('error1inlineerror2');
  });

  test('should work with async resolution', async function() {
    @Injectable()
    class SimpleExceptionHandler1 implements ExceptionHandler {
      async catch(error: unknown, ctx, next) {
        return 'error1' + await next();
      }
    }

    @Injectable()
    class SimpleExceptionHandler2 implements ExceptionHandler {
      async catch(error: unknown, ctx, next) {
        return 'error2'
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(
        SimpleExceptionHandler1,
        {
          async catch(error, ctx, next, foobar) {
            return foobar + await next();
          },
          inject: ['foobar'],
        },
        SimpleExceptionHandler2,
      )
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler1,
      SimpleExceptionHandler2,
      {
        provide: 'foobar',
        async useFactory() { return 'foobar' },
      }
    ]).init() as Injector;

    const service = await injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(await service.method()).toEqual('error1foobarerror2');
  });

  test('should work with global guards', async function() {
    const order: string[] = [];

    @Injectable()
    class GlobalExceptionHandler1 implements ExceptionHandler {
      catch(error: unknown, context: ExecutionContext, next: NextExceptionHandler) {
        order.push('global1');
        return next();
      }
    }

    @Injectable()
    class GlobalExceptionHandler2 implements ExceptionHandler {
      catch(error: unknown, context: ExecutionContext, next: NextExceptionHandler) {
        order.push('global2');
        return next();
      }
    }

    @Injectable()
    class ClassExceptionHandler implements ExceptionHandler {
      catch(error: unknown, context: ExecutionContext, next: NextExceptionHandler) {
        order.push('class');
        return next();
      }
    }

    @Injectable()
    class MethodExceptionHandler implements ExceptionHandler {
      catch(error: unknown, context: ExecutionContext, next: NextExceptionHandler) {
        order.push('method');
        return next();
      }
    }

    @UseExceptionHandlers(ClassExceptionHandler)
    @Injectable()
    class Service {
      @UseExceptionHandlers(MethodExceptionHandler)
      method() {
        throw new Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      ClassExceptionHandler,
      MethodExceptionHandler,
      {
        provide: EXCEPTION_HANDLERS,
        useClass: GlobalExceptionHandler1,
      },
      {
        provide: EXCEPTION_HANDLERS,
        useClass: GlobalExceptionHandler2,
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual(undefined);
    expect(order).toEqual(['global1', 'global2', 'class', 'method']);
  });
});
