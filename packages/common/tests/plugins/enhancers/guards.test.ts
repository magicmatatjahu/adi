import { ADI, Injector, Injectable, Token } from "@adi/core";
import { enhancersPlugin, GUARDS, UseGuards } from "../../../src";

import type { Guard, ExecutionContext } from '../../../src';

describe('Enhancers plugin - guards', function () {
  const plugin = enhancersPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

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

    const injector = Injector.create([
      Service,
      SimpleGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foobar');
  });

  test('should work as injection item', function() {
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

    const injector = Injector.create([
      Service,
      SimpleGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      SimpleGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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

    const injector = Injector.create([
      Service,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;
    
    const service = injector.get(Service) as Service;
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
        if (context.type === 'adi:function-call') {
          return context.data[0] === 'foobar'
        }
        return false;
      }
    }

    @Injectable()
    class Service {
      @UseGuards(SimpleGuard1, SimpleGuard2, SimpleGuard3)
      method(arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      SimpleGuard3,
    ]).init() as Injector;
    
    const service = injector.get(Service) as Service;
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
          canPerform(context, foobar) {
            if (foobar === 'foobar' && context.type === 'adi:function-call') {
              return context.data[0] === 'foobar'
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

    const injector = Injector.create([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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
        if (context.type === 'adi:function-call') {
          return context.data[0] === 'foobar'
        }
        return false
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

    const injector = Injector.create([
      Service,
      ClassGuard,
      MethodGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar');
    expect(service.method('foo')).toEqual(undefined);
  });

  test('should work with multiple definition of guards', function() {
    @Injectable()
    class ClassGuard1 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class ClassGuard2 implements Guard {
      canPerform(context: ExecutionContext) {
        return true;
      }
    }

    @Injectable()
    class MethodGuard2 implements Guard {
      canPerform(context: ExecutionContext) {
        if (context.type === 'adi:function-call') {
          return context.data[0] === 'foobar'
        }
        return false
      }
    }

    @Injectable()
    class MethodGuard1 implements Guard {
      canPerform(context: ExecutionContext) {
        if (context.type === 'adi:function-call') {
          return context.data[0] === 'foobar'
        }
        return false
      }
    }

    @UseGuards(ClassGuard2)
    @UseGuards(ClassGuard1)
    @Injectable()
    class Service {
      @UseGuards(MethodGuard2)
      @UseGuards(MethodGuard1)
      method(arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      ClassGuard1,
      ClassGuard2,
      MethodGuard1,
      MethodGuard2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar');
    expect(service.method('foo')).toEqual(undefined);
  })

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
          async canPerform(context) { 
            if (context.type === 'adi:function-call') {
              return context.data[0] === 'foobar'
            }
            return false
          },
        },
        SimpleGuard2,
      )
      method(arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimpleGuard1,
      SimpleGuard2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
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
              return ctx.data[0] === 'foobar';
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

    const injector = Injector.create([
      Service,
      SimpleGuard1,
      SimpleGuard2,
      {
        provide: 'foobar',
        async useFactory() { return 'foobar' },
      }
    ]).init() as Injector;

    const service = await injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(await service.method('foobar')).toEqual('foobar');
    expect(await service.method('foo')).toEqual(undefined);
  });

  test('should work with global guards', async function() {
    const order: string[] = [];

    @Injectable()
    class GlobalGuard1 implements Guard {
      canPerform(_: ExecutionContext) {
        order.push('global1');
        return true;
      }
    }

    @Injectable()
    class GlobalGuard2 implements Guard {
      canPerform(_: ExecutionContext) {
        order.push('global2');
        return true;
      }
    }

    @Injectable()
    class ClassGuard implements Guard {
      canPerform(_: ExecutionContext) {
        order.push('class');
        return true;
      }
    }

    @Injectable()
    class MethodGuard implements Guard {
      canPerform(_: ExecutionContext) {
        order.push('method');
        return true;
      }
    }

    @UseGuards(ClassGuard)
    @Injectable()
    class Service {
      @UseGuards(MethodGuard)
      method() {
        return 'foo';
      }
    }

    const injector = Injector.create([
      Service,
      ClassGuard,
      MethodGuard,
      {
        provide: GUARDS,
        useClass: GlobalGuard1,
      },
      {
        provide: GUARDS,
        useClass: GlobalGuard2,
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method()).toEqual('foo');
    expect(order).toEqual(['global1', 'global2', 'class', 'method']);
  });
});
