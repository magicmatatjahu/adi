import { Injector, Injectable, Inject, NewPath } from "../../src";

describe('Value wrapper', function() {
  test('should override inferred token', function() {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewPath('a.b.c')) readonly value1: string,
        @Inject('token', NewPath('a.d')) readonly value2: string,
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

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.value1).toEqual('foo');
    expect(service.value2).toEqual('bar');
  });
});