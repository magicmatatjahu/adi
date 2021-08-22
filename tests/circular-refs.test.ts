import { Injector, Injectable, Inject, Ref, OnInit } from "../src";

describe('Circular refs', function() {
  test('should handle simple case, when one class needs second and vice versa (with onInit hooks to assert proper order of initialization)', function() {
    let onInitOrder = [];

    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceA property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceA)) readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceB', 'ServiceA']);
  });

  test('should handle more complex case, A -> B -> C -> D -> A (with onInit hooks to assert proper order of initialization)', function() {
    let onInitOrder = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceC property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceC)) readonly serviceC: ServiceC,
      ) {}

      onInit() {
        // check that serviceC is created and has serviceD property
        if (Object.keys(this.serviceC).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    @Injectable()
    class ServiceC {
      constructor(
        @Inject(Ref(() => ServiceD)) readonly serviceD: ServiceD,
      ) {}

      onInit() {
        // check that serviceD is created and has serviceA property
        if (Object.keys(this.serviceD).length) {
          onInitOrder.push('ServiceC');
        }
      }
    }

    @Injectable()
    class ServiceD {
      constructor(
        readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceD');
        }
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
    ]);

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceC).toBeInstanceOf(ServiceC);
    expect(service.serviceB.serviceC.serviceD).toBeInstanceOf(ServiceD);
    expect(service.serviceB.serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceC.serviceD.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceD', 'ServiceC', 'ServiceB', 'ServiceA']);
  });

  test('should handle deep circular references, A -> B -> C -> D -> A, and also C -> E -> F -> G -> C (with onInit hooks to assert proper order of initialization)', function() {
    let onInitOrder = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceC property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceC)) readonly serviceC: ServiceC,
      ) {}

      onInit() {
        // check that serviceC is created and has serviceD property
        if (Object.keys(this.serviceC).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    @Injectable()
    class ServiceC {
      constructor(
        @Inject(Ref(() => ServiceD)) readonly serviceD: ServiceD,
        @Inject(Ref(() => ServiceE)) readonly serviceE: ServiceE,
      ) {}

      onInit() {
        // check that serviceD is created and has serviceA property
        // check that serviceE is created and has serviceF property
        if (Object.keys(this.serviceD).length && Object.keys(this.serviceE).length) {
          onInitOrder.push('ServiceC');
        }
      }
    }

    @Injectable()
    class ServiceD {
      constructor(
        readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceD');
        }
      }
    }

    @Injectable()
    class ServiceE {
      constructor(
        @Inject(Ref(() => ServiceF)) readonly serviceF: ServiceF,
      ) {}

      onInit() {
        // check that serviceF is created and has serviceG property
        if (Object.keys(this.serviceF).length) {
          onInitOrder.push('ServiceE');
        }
      }
    }

    @Injectable()
    class ServiceF {
      constructor(
        @Inject(Ref(() => ServiceG)) readonly serviceG: ServiceG,
      ) {}

      onInit() {
        // check that serviceG is created and has serviceC property
        if (Object.keys(this.serviceG).length) {
          onInitOrder.push('ServiceF');
        }
      }
    }

    @Injectable()
    class ServiceG {
      constructor(
        readonly serviceC: ServiceC,
      ) {}

      onInit() {
        // check that serviceC is created and has some properties
        if (
          Object.keys(this.serviceC).length && 
          Object.keys(this.serviceC?.serviceD).length && 
          Object.keys(this.serviceC?.serviceE).length
        ) {
          onInitOrder.push('ServiceG');
        }
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
      ServiceE,
      ServiceF,
      ServiceG,
    ]);

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceC).toBeInstanceOf(ServiceC);
    expect(service.serviceB.serviceC.serviceD).toBeInstanceOf(ServiceD);
    expect(service.serviceB.serviceC.serviceE).toBeInstanceOf(ServiceE);
    expect(service.serviceB.serviceC.serviceE.serviceF).toBeInstanceOf(ServiceF);
    expect(service.serviceB.serviceC.serviceE.serviceF.serviceG).toBeInstanceOf(ServiceG);
    expect(service.serviceB.serviceC === service.serviceB.serviceC.serviceE.serviceF.serviceG.serviceC).toEqual(true);
    expect(service.serviceB.serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceC.serviceD.serviceA).toEqual(true);
    // ServiceG first exec `onInit` function because it is the last provider in the chain of resolution
    // ServiceC first go to Service D (as first argument in constructor) and then go to Service E -> F -> G -> C
    expect(onInitOrder).toEqual(['ServiceG', 'ServiceF', 'ServiceE', 'ServiceD', 'ServiceC', 'ServiceB', 'ServiceA']);
  });

  test('should handle simple case, when one class needs second and vice versa (with onInit hooks to assert proper order of initialization) - async resolution', async function() {
    let onInitOrder = [];

    @Injectable()
    class ServiceA {
      constructor(
        @Inject(Ref(() => ServiceB)) readonly serviceB: ServiceB,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceA property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB {
      constructor(
        @Inject(Ref(() => ServiceA)) readonly serviceA: ServiceA,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    const injector = new Injector([
      ServiceA,
      ServiceB,
    ]);

    const service = await injector.getAsync(ServiceA);
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceB', 'ServiceA']);
  });
});
