import { Injector, Injectable } from "../../src";
import { wait } from "../helpers";
import { InjectorStatus } from "../../src/enums";

describe('scoped injector', function() {
  it('should create scoped injector to given injector', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const scopedInjector = injector.of();
    const service = scopedInjector.get(Service)

    expect(scopedInjector).toBeInstanceOf(Injector);
    expect(service).toBeInstanceOf(Service);
  });

  it('should reuse labels for scoped injector', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const scopedInjector1 = injector.of('some-label');
    const scopedInjector2 = injector.of('some-label');

    expect(scopedInjector1).toBeInstanceOf(Injector);
    expect(scopedInjector2).toBeInstanceOf(Injector);
    expect(scopedInjector1 === scopedInjector2).toEqual(true);
  });

  it('should create new injector on every time without specified label', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const scopedInjector1 = injector.of();
    const scopedInjector2 = injector.of();

    expect(scopedInjector1).toBeInstanceOf(Injector);
    expect(scopedInjector2).toBeInstanceOf(Injector);
    expect(scopedInjector1 === scopedInjector2).toEqual(false);
  });

  it('scoped destroy scoped injector when recreating option is passed', async function() {
    const injector = Injector.create([]);
    const scopedInjector1 = injector.of('scoped-injector');
    const scopedInjector2 = injector.of('scoped-injector', [], { recreate: true });
    const scopedInjector3 = injector.of('scoped-injector', [], { recreate: true });

    // wait for destruction of injectors
    await wait()

    // check if injector is not destroyed
    expect((injector!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
    expect((scopedInjector1!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
    expect((scopedInjector2!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
    expect((scopedInjector3!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
  });

  it('scoped injector should not override services from parent', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const scopedInjector = injector.of({ providers: [Service] });

    const service = injector.get(Service);
    const scopedService = scopedInjector.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(scopedService).toBeInstanceOf(Service);
    expect(service === scopedService).toEqual(false);
  });

  it('should reuse services for scoped injector with labels', function() {
    @Injectable()
    class Service {}

    const injector = Injector.create([
      Service
    ])

    const scopedInjector1 = injector.of('some-label', [Service]);
    const scopedInjector2 = injector.of('some-label', [Service]);

    const service = injector.get(Service);
    const scopedService1 = scopedInjector1.get(Service);
    const scopedService2 = scopedInjector1.get(Service);

    expect(scopedInjector1).toBeInstanceOf(Injector);
    expect(scopedInjector2).toBeInstanceOf(Injector);
    expect(scopedInjector1 === scopedInjector2).toEqual(true);
    expect(service).toBeInstanceOf(Service);
    expect(scopedService1).toBeInstanceOf(Service);
    expect(scopedService2).toBeInstanceOf(Service);
    expect(service === scopedService1).toEqual(false);
    expect(service === scopedService2).toEqual(false);
    expect(scopedService1 === scopedService2).toEqual(true);
  });

  it('should work with the "using" statement', async function() {
    let calls = 0;

    @Injectable()
    class Service {
      onDestroy() {
        calls++;
      }
    }

    const injector = Injector.create()

    async function testing() {
      await using scoped = injector.of([
        Service
      ]);
      await scoped.get(Service)
    }
  
    await testing();
    await testing();
    await testing();
    expect(calls).toEqual(3);
  });

  it('should not destroy with "destroy: false" option', async function() {
    const injector = Injector.create([]);
    const scoped = injector.of('some-label')
  
    await scoped.destroy();
    expect(scoped.status & InjectorStatus.DESTROYED).toEqual(InjectorStatus.DESTROYED);
  });

  it('should not destroy with "destroy: false" option', async function() {
    const injector = Injector.create([]);
    const scoped = injector.of('some-label', [], { destroy: false })
  
    await scoped.destroy();
    expect(scoped.status & InjectorStatus.DESTROYED).toEqual(0);
  });
});
