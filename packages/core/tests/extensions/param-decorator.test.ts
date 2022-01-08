import { Injector, Injectable, createParamDecorator, UsePipes, PipeTransform, ArgumentMetadata, ExecutionContext } from "../../src";

describe('Param decorator', function() {
  test('should work', function() {
    const TestParam =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param' });

    @Injectable()
    class Service {
      method(@TestParam() foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar');
  });

  test('should override previous defined', function() {
    const TestParam1 =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param1' });

    const TestParam2 =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar overrided';
    }, { name: 'test-param2' });

    @Injectable()
    class Service {
      method(@TestParam2() @TestParam1() foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar overrided');
  });

  test('should work with pipes (defined before param decorator)', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    const TestParam =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param' });

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe) @TestParam() foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar transformed');
  });

  test('should work with pipes (defined after param decorator)', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    const TestParam =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param' });

    @Injectable()
    class Service {
      method(@TestParam() @UsePipes(SimplePipe) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar transformed');
  });

  test('should work with pipes (override previous defined)', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed and overrided';
      }
    }

    const TestParam =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param' });

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe2) @TestParam() @UsePipes(SimplePipe1) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar transformed and overrided');
  });

  test('should work with pipes multiple pipes', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' two times';
      }
    }

    const TestParam =  createParamDecorator((arg, ctx) => {
      const value = ctx.getArgs(arg.index);
      return value + 'bar';
    }, { name: 'test-param' });

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe1, SimplePipe2) @TestParam() foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foo')).toEqual('foobar transformed two times');
  });
});
