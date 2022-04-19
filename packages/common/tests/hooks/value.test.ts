import { Injector, Inject, Injectable } from "@adi/core";
import { Value } from "../../src/hooks";

describe('Value injection hook', function() {
  test('should return given deep value from object', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [Value('a.b.c')]) readonly value1: string,
        @Inject('token', [Value('a.d')]) readonly value2: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: {
              c: 'foo'
            },
            d: 'bar'
          }
        },
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual('bar');
  });

  test('should handle array indexes notation', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [Value('a.b.0.c')]) readonly value1: string,
        @Inject('token', [Value('a.b.1.d')]) readonly value2: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: [
              {
                c: 'foo'
              },
              {
                d: 'bar'
              }
            ]
          }
        },
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual('bar');
  });

  test('should return undefined if given path does not exist', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [Value('a.b.0.c')]) readonly value1: string,
        @Inject('token', [Value('a.b.1.e')]) readonly value2: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: [
              {
                c: 'foo'
              },
              {
                d: 'bar'
              }
            ]
          }
        },
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual(undefined);
  });

  test('should return root object when path is not passed', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [Value()]) readonly value1: string,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: {
              c: 'foo'
            },
            d: 'bar'
          }
        },
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual({
      a: {
        b: {
          c: 'foo'
        },
        d: 'bar'
      }
    });
  });
});