import { Injector, Injectable, Scope, createWrapper } from "../../src";

describe('useExisting', function() {
  test('should return value from alias', function() {
    @Injectable()
    class Service {}

    const injector = new Injector([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
      },
    ]);

    const service = injector.get(Service);
    const useExisting = injector.get<Service>('useExisting');
    expect(useExisting).toBeInstanceOf(Service);
    expect(service === useExisting).toEqual(true);
  });

  test('should inherite scope from alias provider', function() {
    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {}

    const injector = new Injector([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
      },
    ]);

    const service = injector.get(Service);
    const useExisting = injector.get<Service>('useExisting');
    expect(useExisting).toBeInstanceOf(Service);
    expect(service === useExisting).toEqual(false);
    expect(injector.get<Service>('useExisting') === injector.get<Service>('useExisting')).toEqual(false);
  });

  test('should works with wrappers', function() {
    const TestWrapper = createWrapper(() => {
      return (session, next) => {
        const value = next(session);
        value.prop = {};
        return value;
      }
    });

    @Injectable({
      scope: Scope.TRANSIENT,
    })
    class Service {
      prop: object = null;
    }

    const injector = new Injector([
      Service,
      {
        provide: 'useExisting',
        useExisting: Service,
        useWrapper: TestWrapper(),
      },
    ]);

    const service = injector.get(Service);
    const useExisting1 = injector.get<Service>('useExisting');
    const useExisting2 = injector.get<Service>('useExisting');
    expect(useExisting1).toBeInstanceOf(Service);
    expect(useExisting2).toBeInstanceOf(Service);
    expect(service === useExisting1).toEqual(false);
    expect(service === useExisting2).toEqual(false);
    expect(useExisting1.prop === null).toEqual(false);
    expect(useExisting2.prop === null).toEqual(false);
    expect(useExisting1.prop === useExisting2.prop).toEqual(false);
  });

  test('should persist session', function() {
    const TestWrapper = createWrapper(() => {
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

    const injector = new Injector([
      Service,
      {
        provide: Service,
        useWrapper: TestWrapper(),
      },
      {
        provide: 'useExisting',
        useExisting: Service,
        useWrapper: TestWrapper(),
      },
    ]);

    const useExisting = injector.get<Service>('useExisting');
    expect(useExisting).toBeInstanceOf(Service);
    expect(useExisting.prop).toEqual(2);
    expect(useExisting === injector.get<Service>(Service)).toEqual(true);
  });
});
