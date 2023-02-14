import { ADI, Injector, Injectable, Token } from "@adi/core";
import { enhancersPlugin, ExecutionContext, UseInterceptors, UseGuards, UseExceptionHandlers, UsePipes } from "../../../src";

import type { ArgumentMetadata, Interceptor, NextInterceptor, Guard, ExceptionHandler, NextExceptionHandler, PipeTransform } from '../../../src';

describe('Enhancers plugin - execution context', function () {
  const plugin = enhancersPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should work in interceptors', function() {
    let context: ExecutionContext | undefined;

    @Injectable()
    class SimpleInterceptor implements Interceptor {
      intercept(ctx: ExecutionContext, next: NextInterceptor) {
        context = ctx;
        return next();
      }
    }

    @Injectable()
    class Service {
      @UseInterceptors(SimpleInterceptor)
      method(arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimpleInterceptor,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('...')).toEqual('...');
    expect(context).toBeInstanceOf(ExecutionContext);
    expect(context?.instance).toBeInstanceOf(Service);
    expect(context?.type).toEqual('adi:function-call');
    expect(context?.metadata.target).toEqual(Service);
    expect(context?.metadata.key).toEqual('method');
    expect(context?.metadata.descriptor).toEqual(Object.getOwnPropertyDescriptor(Service.prototype, 'method'));
    expect(context?.metadata.static).toEqual(false);
    expect(context?.metadata.reflectedTypes).toEqual([String]);
  });

  test('should work in guards', function() {
    let context: ExecutionContext | undefined;

    @Injectable()
    class SimpleGuard implements Guard {
      canPerform(ctx: ExecutionContext) {
        context = ctx;
        return true
      }
    }

    @Injectable()
    class Service {
      @UseGuards(SimpleGuard)
      method(arg: string) {
        return arg;
      }
    }

    const injector = Injector.create([
      Service,
      SimpleGuard,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('...')).toEqual('...');
    expect(context).toBeInstanceOf(ExecutionContext);
    expect(context?.instance).toBeInstanceOf(Service);
    expect(context?.type).toEqual('adi:function-call');
    expect(context?.metadata.target).toEqual(Service);
    expect(context?.metadata.key).toEqual('method');
    expect(context?.metadata.descriptor).toEqual(Object.getOwnPropertyDescriptor(Service.prototype, 'method'));
    expect(context?.metadata.static).toEqual(false);
    expect(context?.metadata.reflectedTypes).toEqual([String]);
  });

  test('should work in exception handlers', function() {
    let context: ExecutionContext | undefined;

    @Injectable()
    class SimpleExceptionHandler implements ExceptionHandler {
      catch(error: unknown, ctx: ExecutionContext, next: NextExceptionHandler<any>) {
        context = ctx;
        return '...'
      }
    }

    @Injectable()
    class Service {
      @UseExceptionHandlers(SimpleExceptionHandler)
      method(arg: string) {
        throw Error('...');
      }
    }

    const injector = Injector.create([
      Service,
      SimpleExceptionHandler,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.method('...')).toEqual('...');
    expect(context).toBeInstanceOf(ExecutionContext);
    expect(context?.instance).toBeInstanceOf(Service);
    expect(context?.type).toEqual('adi:function-call');
    expect(context?.metadata.target).toEqual(Service);
    expect(context?.metadata.key).toEqual('method');
    expect(context?.metadata.descriptor).toEqual(Object.getOwnPropertyDescriptor(Service.prototype, 'method'));
    expect(context?.metadata.static).toEqual(false);
    expect(context?.metadata.reflectedTypes).toEqual([String]);
  });

  test('should work in pipes (together with argument metadata)', function() {
    let context1: ExecutionContext | undefined;
    let context2: ExecutionContext | undefined;
    let argumentMetadata1: ArgumentMetadata | undefined;
    let argumentMetadata2: ArgumentMetadata | undefined;

    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, ctx: ExecutionContext) {
        context1 = ctx;
        argumentMetadata1 = argument;
        return value + '1';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: any, argument: ArgumentMetadata, ctx: ExecutionContext) {
        context2 = ctx;
        argumentMetadata2 = argument;
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
    expect(context1 === context2).toEqual(true);
    expect(context1).toBeInstanceOf(ExecutionContext);
    expect(context1?.instance).toBeInstanceOf(Service);
    expect(context1?.type).toEqual('adi:function-call');
    expect(context1?.metadata.target).toEqual(Service);
    expect(context1?.metadata.key).toEqual('method');
    expect(context1?.metadata.descriptor).toEqual(Object.getOwnPropertyDescriptor(Service.prototype, 'method'));
    expect(context1?.metadata.static).toEqual(false);
    expect(context1?.metadata.reflectedTypes).toEqual([String, String]);
    expect(argumentMetadata1?.data).toEqual(undefined);
    expect(argumentMetadata2?.data).toEqual(undefined);
    expect(argumentMetadata1?.index).toEqual(0);
    expect(argumentMetadata2?.index).toEqual(1);
    expect(argumentMetadata1?.reflectedType).toEqual(String);
    expect(argumentMetadata2?.reflectedType).toEqual(String);
  });
});
