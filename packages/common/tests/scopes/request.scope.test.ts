import { ADI, Injector, Injectable } from "@adi/core";
import { dynamicScopesPlugin, RequestScope } from "../../src"

describe('Request scope', function () {
  const plugin = dynamicScopesPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  test('should create proxy', function () {
    @Injectable({
      scope: RequestScope,
    })
    class RequestService {}

    @Injectable()
    class Service {
      constructor(
        readonly requestService: RequestService,
      ) {}
    }

    const injector = Injector.create([
      RequestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    console.log(service.requestService);
  });
});
