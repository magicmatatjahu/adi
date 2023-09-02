import { Injector, Injectable, ModuleToken } from "../../src";

describe('ModuleToken', function() {
  test('should behave like normal class module', function() {
    @Injectable()
    class Service {}

    const MainModule = new ModuleToken({
      providers: [
        Service,
      ]
    });
    const injector = Injector.create(MainModule)

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should behave like normal imported module', async function() {
    @Injectable()
    class Service {}

    const ChildModule = new ModuleToken({
      providers: [
        Service,
      ],
      exports: [
        Service,
      ]
    });
    const MainModule = new ModuleToken({
      imports: [
        ChildModule,
      ],
    });
    const injector = Injector.create(MainModule)

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
