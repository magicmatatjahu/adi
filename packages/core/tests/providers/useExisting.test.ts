import { Injector, Injectable, TransientScope, createHook } from "../../src";

describe('useExisting', function() {
  test('should return value from alias', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
      },
    ]).init() as Injector;

    const service = injector.get(Service);
    const useExisting = injector.get<Service>('useExisting');
    expect(useExisting).toBeInstanceOf(Service);
    expect(service === useExisting).toEqual(true);
  });

  test('should inherite scope from alias provider', function() {
    @Injectable({
      scope: TransientScope,
    })
    class Service {}

    const injector = Injector.create([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
      },
    ]).init() as Injector;

    const service = injector.get(Service);
    const useExisting = injector.get<Service>('useExisting');
    expect(useExisting).toBeInstanceOf(Service);
    expect(service === useExisting).toEqual(false);
    expect(injector.get<Service>('useExisting') === injector.get<Service>('useExisting')).toEqual(false);
  });

  test('should work with hooks', function() {
    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        value.prop = {};
        return value;
      }
    });

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      prop: object = null;
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
        hooks: [TestHook()],
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    const useExisting1 = injector.get<Service>('useExisting') as Service;
    const useExisting2 = injector.get<Service>('useExisting') as Service;
    expect(useExisting1).toBeInstanceOf(Service);
    expect(useExisting2).toBeInstanceOf(Service);
    expect(service === useExisting1).toEqual(false);
    expect(service === useExisting2).toEqual(false);
    expect(useExisting1 === useExisting2).toEqual(false);
    expect(useExisting1.prop === null).toEqual(false);
    expect(useExisting2.prop === null).toEqual(false);
    expect(useExisting1.prop === useExisting2.prop).toEqual(false);
  });

  test('should persist session', function() {
    const TestHook = createHook(() => {
      return (session, next) => {
        const value = next(session);
        value.prop++;
        return value;
      }
    });

    @Injectable()
    class Service {
      prop: number = 0;
    }

    const injector = Injector.create([
      Service,
      {
        provide: Service,
        hooks: [TestHook()],
      },
      {
        provide: 'useExisting',
        useExisting: Service,
        hooks: [TestHook()],
      },
    ]).init() as Injector;

    const useExisting = injector.get<Service>('useExisting') as Service;
    expect(useExisting).toBeInstanceOf(Service);
    expect(useExisting.prop).toEqual(2);
    expect(useExisting === injector.get<Service>(Service)).toEqual(true);
  });
});
