import { ADI, Injector, Injectable, Token } from "@adi/core";
import { enhancersPlugin, PIPES, UsePipes } from "../../../src";

import type { ArgumentMetadata, ExecutionContext, PipeTransform } from '../../../src';

describe.skip('Enhancers plugin - pipes', function() {
  const plugin = enhancersPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work as provider', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe) foo: string) {
        return foo;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as injection item', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(Token(SimplePipe)) foo: string) {
        return foo;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as instance of class', function() {
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(new SimplePipe()) foo: string) {
        return foo;
      }
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as injection function', function() {
    @Injectable()
    class Service {
      method(@UsePipes({
        transform(value: string, arg, ctx, foobar) {
          if (foobar === 'foobar') {
            return value + ' transformed';
          }
          return value;
        },
        inject: ['foobar'],
      }) foo: string) {
        return foo;
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
    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work with multiple pipes', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' and overrided';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe1, SimplePipe2) arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar transformed and overrided');
  });

  test('should work with multiple pipes (different types)', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(
        SimplePipe1,
        {
          transform(value: string, arg, ctx, foobar) {
            if (foobar === 'foobar') {
              return value + ' by';
            }
            return value;
          },
          inject: ['foobar'],
        },
        SimplePipe2,
      ) arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe1,
      SimplePipe2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar transformed by three pipes');
  });

  test('should work with pipes passed on class togerther with method pipes', function() {
    @Injectable()
    class ClassPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' class';
      }
    }

    @Injectable()
    class MethodPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' method';
      }
    }

    @Injectable()
    class ParameterPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' parameter';
      }
    }

    @UsePipes(ClassPipe)
    @Injectable()
    class Service {
      @UsePipes(MethodPipe)
      method(@UsePipes(ParameterPipe) arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      ClassPipe,
      MethodPipe,
      ParameterPipe,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar')).toEqual('foobar class method parameter');
  });

  test('should work with pipes passed on class togerther with method pipes without pipes on parameter', function() {
    @Injectable()
    class ClassPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' class';
      }
    }

    @Injectable()
    class MethodPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' method';
      }
    }

    @UsePipes(ClassPipe)
    @Injectable()
    class Service {
      @UsePipes(MethodPipe)
      method(@UsePipes() arg1: string, arg2: string) {
        return arg1 + arg2;
      }
    }

    const injector = Injector.create([
      Service,
      ClassPipe,
      MethodPipe,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foobar', ' and without parameter')).toEqual('foobar class method and without parameter');
  });

  test('should work with async transform functions', async function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(
        @UsePipes(
          SimplePipe1,
          {
            async transform(value: string) { return value + ' by' },
          },
          SimplePipe2,
        )
        arg: string,
      ) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(await service.method('foobar')).toEqual('foobar transformed by three pipes');
  });

  test('should work with async resolution', async function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(
        @UsePipes(
          SimplePipe1,
          {
            async transform(value: string, arg, ctx, foobar) {
              if (foobar === 'foobar') {
                return value + ' by';
              }
              return value;
            },
            inject: ['foobar'],
          },
          SimplePipe2,
        )
        arg: string
      ) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe1,
      SimplePipe2,
      {
        provide: 'foobar',
        async useFactory() { return 'foobar' },
      }
    ]).init() as Injector;

    const service = await injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(await service.method('foobar')).toEqual('foobar transformed by three pipes');
  });

  test('should work with global pipes', async function() {
    const order: string[] = [];

    @Injectable()
    class GlobalPipe1 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, context: ExecutionContext) {
        return value + ' global1';
      }
    }

    @Injectable()
    class GlobalPipe2 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, context: ExecutionContext) {
        return value + ' global2';
      }
    }

    @Injectable()
    class ClassPipe implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, context: ExecutionContext) {
        return value + ' class';
      }
    }

    @Injectable()
    class MethodPipe implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, context: ExecutionContext) {
        return value + ' method';
      }
    }

    @Injectable()
    class ParameterPipe implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, context: ExecutionContext) {
        return value + ' parameter';
      }
    }

    @UsePipes(ClassPipe)
    @Injectable()
    class Service {
      @UsePipes(MethodPipe)
      method(@UsePipes(ParameterPipe) arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      ClassPipe,
      MethodPipe,
      ParameterPipe,
      {
        provide: PIPES,
        useClass: GlobalPipe1,
      },
      {
        provide: PIPES,
        useClass: GlobalPipe1,
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('foo')).toEqual('foo global1 global1 class method parameter');
  });

  test('should work with multiple pipes in method', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, ctx: ExecutionContext) {
        return value + '1';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, ctx: ExecutionContext) {
        return value + '2';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe1) arg1: string, @UsePipes(SimplePipe2) arg2: string) {
        return arg1 + ' ' + arg2;
      }
    }

    const injector = Injector.create([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('arg', 'arg')).toEqual('arg1 arg2');
  });
});
