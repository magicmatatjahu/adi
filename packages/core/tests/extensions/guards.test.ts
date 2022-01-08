import { Injector, Injectable, ExecutionContext, Guard, UseGuards, Token } from "../../src";

describe('Guards', function() {
  test('should work (as provider) - reject case', function() {
    @Injectable()
    class SimpleGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return false;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(SimpleGuard)
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual(undefined);
  });

  test('should work (as provider) - approve case', function() {
    @Injectable()
    class SimpleGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(SimpleGuard)
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual('foobar');
  });

  test('should work as wrapper', function() {
    @Injectable()
    class SimpleGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return false;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(Token(SimpleGuard))
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual(undefined);
  });

  test('should work as instance of class', function() {
    class SimpleGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return false;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(new SimpleGuard())
      method() {
        return 'foobar';
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method()).toEqual(undefined);
  });

  test('should work as injection function', function() {
    @Injectable()
    class Service {
      @UseGuards({
        canPerform(ctx, foobar) {
          if (foobar === 'foobar') {
            return false;
          }
          return true;
        },
        inject: ['foobar'],
      })
      method() {
        return 'foobar';
      }
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

    expect(service.method()).toEqual(undefined);
  });

  test('should work with multiple guards', function() {
    @Injectable()
    class SimpleGuard1 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class SimpleGuard2 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class SimpleGuard3 implements Guard {
      canPerform(context: ExecutionContext) {
        return context.getArgs(0) === 'foobar';
      }
    }

    @Injectable()
    class Service {
      @UseGuards(SimpleGuard1, SimpleGuard2, SimpleGuard3)
      method(arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      SimpleGuard3,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar');
    expect(service.method('foo')).toEqual(undefined);
  });

  test('should work with multiple guards (different types)', function() {
    @Injectable()
    class SimpleGuard1 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class SimpleGuard2 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(
        SimpleGuard1,
        {
          canPerform(ctx, foobar) {
            if (foobar === 'foobar') {
              return ctx.getArgs(0) === 'foobar';
            }
            return false;
          },
          inject: ['foobar'],
        },
        SimpleGuard2,
      )
      method(arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar');
    expect(service.method('foo')).toEqual(undefined);
  });

  test('should work with guards passed on class togerther with method guards', function() {
    @Injectable()
    class ClassGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class MethodGuard implements Guard {
      canPerform(context: ExecutionContext) {
        return context.getArgs(0) === 'foobar';
      }
    }

    @UseGuards(ClassGuard)
    @Injectable()
    class Service {
      @UseGuards(MethodGuard)
      method(arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      ClassGuard,
      MethodGuard,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar');
    expect(service.method('foo')).toEqual(undefined);
  });

  test('should work with async canPerform functions', async function() {
    @Injectable()
    class SimpleGuard1 implements Guard {
      async canPerform(context: ExecutionContext) {
        return true; 
      }
    }

    @Injectable()
    class SimpleGuard2 implements Guard {
      async canPerform(context: ExecutionContext) {
        return true; 
      }
    }

    @Injectable()
    class Service {
      @UseGuards(
        SimpleGuard1,
        {
          async canPerform(ctx) { return ctx.getArgs(0) === 'foobar'; },
        },
        SimpleGuard2,
      )
      method(arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard1,
      SimpleGuard2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method('foobar')).toEqual('foobar');
    expect(await service.method('foo')).toEqual(undefined);
  });

  test('should work with async resolution', async function() {
    @Injectable()
    class SimpleGuard1 implements Guard {
      async canPerform(context: ExecutionContext) {
        return true; 
      }
    }

    @Injectable()
    class SimpleGuard2 implements Guard {
      async canPerform(context: ExecutionContext) {
        return true; 
      }
    }

    @Injectable()
    class Service {
      @UseGuards(
        SimpleGuard1,
        {
          async canPerform(ctx, foobar) {
            if (foobar === 'foobar') {
              return ctx.getArgs(0) === 'foobar';
            }
            return false;
          },
          inject: ['foobar'],
        },
        SimpleGuard2,
      )
      method(arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      {
        provide: 'foobar',
        async useFactory() { return 'foobar' },
      }
    ]);
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method('foobar')).toEqual('foobar');
    expect(await service.method('foo')).toEqual(undefined);
  });
});
