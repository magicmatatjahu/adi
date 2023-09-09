import { Injector, Injectable } from "../../src";

describe('aliases annotation', function() {
  it('should point to the existing provider definition using aliases', function() {
    const symbolService = Symbol();

    @Injectable({
      annotations: {
        aliases: ['service', symbolService]
      }
    })
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const service = injector.getSync(Service);
    const stringAlias = injector.get('service');
    const symbolAlias = injector.get(symbolService);

    expect(service).toBeInstanceOf(Service);
    expect(stringAlias).toBeInstanceOf(Service);
    expect(symbolAlias).toBeInstanceOf(Service);
    expect(service).toStrictEqual(stringAlias);
    expect(service).toStrictEqual(symbolAlias);
  });

  it('should not point to the existing provider definition when aliases are not defined', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(() => injector.get('service')).toThrowError()
    expect(() => injector.get('symbolService')).toThrowError()    
  });
});
