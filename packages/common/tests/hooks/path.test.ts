import { Injector, Inject, Injectable } from "@adi/core";

import { Path } from "../../src/hooks";

describe('Path wrapper', function() {
  test('should return given deep value from object', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Path('a.b.c')) readonly value1: string,
        @Inject('token', Path('a.d')) readonly value2: string,
      ) {}
    }

    const injector = new Injector([
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
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual('bar');
  });

  test('should handle array indexes notation', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Path('a.b.0.c')) readonly value1: string,
        @Inject('token', Path('a.b.1.d')) readonly value2: string,
      ) {}
    }

    const injector = new Injector([
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
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual('bar');
  });

  test('should return undefined if given path does not exist', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Path('a.b.0.c')) readonly value1: string,
        @Inject('token', Path('a.b.1.e')) readonly value2: string,
      ) {}
    }

    const injector = new Injector([
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
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual(undefined);
  });
});