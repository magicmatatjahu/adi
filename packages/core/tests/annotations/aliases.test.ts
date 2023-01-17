import { Injector, Injectable } from "../../src";

describe('aliases annotation', function() {
  it('should point to the existing provider definition', function() {
    const symbolService = Symbol();

    @Injectable({
      annotations: {
        aliases: ['service', symbolService]
      }
    })
    class Service {}

    const injector = Injector.create([
      Service
    ]).init() as Injector;

    const service = injector.get(Service);
    const stringAlias = injector.get('service');
    const symbolAlias = injector.get(symbolService);

    expect(service).toBeInstanceOf(Service);
    expect(stringAlias).toBeInstanceOf(Service);
    expect(symbolAlias).toBeInstanceOf(Service);
    expect(service).toEqual(stringAlias);
    expect(service).toEqual(symbolAlias);
  });
});
