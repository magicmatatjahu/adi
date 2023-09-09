import { Injector, Injectable, ModuleToken } from "../../src";

describe('ModuleToken', function() {
  test('should behave like normal class module', function() {
    @Injectable()
    class Service {}

    const MainModule = ModuleToken.create({
      providers: [
        Service,
      ]
    });
    const injector = Injector.create(MainModule)

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  test('should work with imported module', async function() {
    @Injectable()
    class Service {}

    const ChildModule = ModuleToken.create({
      providers: [
        Service,
      ],
      exports: [
        Service,
      ]
    });
    const MainModule = ModuleToken.create({
      imports: [
        ChildModule,
      ],
    });
    const injector = Injector.create(MainModule)

    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });
});
