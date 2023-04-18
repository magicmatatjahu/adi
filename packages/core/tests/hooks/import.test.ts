import { Injector, Injectable, Inject, Import } from "../../src";

describe('Import injection hook', function () {
  test('should handle exception when token is not defined in providers array', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject(Import(() => import('./import.testdata').then(data => data.ChunkClass))) readonly service: any
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = await injector.get(Service);
    expect(service.service.constructor.name).toEqual('ChunkClass');
  });
});
