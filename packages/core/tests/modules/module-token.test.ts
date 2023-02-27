import { Injector, Injectable, ModuleToken } from "../../src";

describe('ModuleToken', function() {
  test('should behave like normal class module', async function() {
    @Injectable()
    class Service {}

    const MainModule = new ModuleToken({
      providers: [
        Service,
      ]
    });
    const injector = await Injector.create(MainModule).init();

    const service = injector.get(Service);
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
    const injector = await Injector.create(MainModule).init();

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
