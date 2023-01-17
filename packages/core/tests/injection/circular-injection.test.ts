import { Injector, Injectable, Inject, Ref, OnInit } from "../../src";

describe('circular injection', function() {
  test.skip('should handle simple case, when one class needs second and vice versa - with onInit hooks to assert proper order of initialization', function() {
    const onInitOrder: string[] = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceB)
        ])
        readonly serviceB: any,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceA property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceA)
        ])
        readonly serviceA: any,
      ) {}

      onInit() {
        // check that serviceA is created and has serviceB property
        if (Object.keys(this.serviceA).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    const injector = Injector.create([
      ServiceA,
      ServiceB,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceB', 'ServiceA']);
  });

  test.skip('should handle more complex case, A -> B -> C -> D -> A - with onInit hooks to assert proper order of initialization', function() {
    const onInitOrder: string[] = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceB)
        ])
        readonly serviceB: any,
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
        @Inject([
          Ref(() => ServiceC)
        ]) 
        readonly serviceC: any,
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
        @Inject([
          Ref(() => ServiceD)
        ])
        readonly serviceD: any,
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

    const injector = Injector.create([
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
    ]).init() as Injector;

    const service = injector.get(ServiceA) as ServiceA;
    expect(service).toBeInstanceOf(ServiceA);
    expect(service.serviceB).toBeInstanceOf(ServiceB);
    expect(service.serviceB.serviceC).toBeInstanceOf(ServiceC);
    expect(service.serviceB.serviceC.serviceD).toBeInstanceOf(ServiceD);
    expect(service.serviceB.serviceC.serviceD.serviceA).toBeInstanceOf(ServiceA);
    expect(service === service.serviceB.serviceC.serviceD.serviceA).toEqual(true);
    expect(onInitOrder).toEqual(['ServiceD', 'ServiceC', 'ServiceB', 'ServiceA']);
  });

  test.skip('should handle deep circular references, A -> B -> C -> D -> A, and also C -> E -> F -> G -> C (case one) - with onInit hooks to assert proper order of initialization', function() {
    const onInitOrder: string[] = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceB)
        ])
        readonly serviceB: any,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceC property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceC)
        ])
        readonly serviceC: any,
      ) {}

      onInit() {
        // check that serviceC is created and has serviceD property
        if (Object.keys(this.serviceC).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    @Injectable()
    class ServiceC implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceD)
        ])
        readonly serviceD: any,
        @Inject([
          Ref(() => ServiceE)
        ])
        readonly serviceE: any,
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
    class ServiceD implements OnInit {
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
    class ServiceE implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceF)
        ]) 
        readonly serviceF: any,
      ) {}

      onInit() {
        // check that serviceF is created and has serviceG property
        if (Object.keys(this.serviceF).length) {
          onInitOrder.push('ServiceE');
        }
      }
    }

    @Injectable()
    class ServiceF implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceG)
        ]) 
        readonly serviceG: any,
      ) {}

      onInit() {
        // check that serviceG is created and has serviceC property
        if (Object.keys(this.serviceG).length) {
          onInitOrder.push('ServiceF');
        }
      }
    }

    @Injectable()
    class ServiceG implements OnInit {
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

    const injector = Injector.create([
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
      ServiceE,
      ServiceF,
      ServiceG,
    ]).init() as Injector;

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
    // ServiceD first exec `onInit` function because it is the last provider in the chain of resolution
    // ServiceC first go to Service D (as first argument in constructor) and then go to Service E -> F -> G -> C
    expect(onInitOrder).toEqual(['ServiceD', 'ServiceG', 'ServiceF', 'ServiceE', 'ServiceC', 'ServiceB', 'ServiceA']);
  });

  // this case is different from case one that ServiceE is on the first argument of the ServiceC's constructor
  test.skip('should handle deep circular references, A -> B -> C -> D -> A, and also C -> E -> F -> G -> C (case two) - with onInit hooks to assert proper order of initialization', function() {
    const onInitOrder: string[] = [];

    @Injectable()
    class ServiceA implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceB)
        ])
        readonly serviceB: any,
      ) {}

      onInit() {
        // check that serviceB is created and has serviceC property
        if (Object.keys(this.serviceB).length) {
          onInitOrder.push('ServiceA');
        }
      }
    }

    @Injectable()
    class ServiceB implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceC)
        ])
        readonly serviceC: any,
      ) {}

      onInit() {
        // check that serviceC is created and has serviceD property
        if (Object.keys(this.serviceC).length) {
          onInitOrder.push('ServiceB');
        }
      }
    }

    @Injectable()
    class ServiceC implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceE)
        ])
        readonly serviceE: any,
        @Inject([
          Ref(() => ServiceD)
        ])
        readonly serviceD: any,
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
    class ServiceD implements OnInit {
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
    class ServiceE implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceF)
        ]) 
        readonly serviceF: any,
      ) {}

      onInit() {
        // check that serviceF is created and has serviceG property
        if (Object.keys(this.serviceF).length) {
          onInitOrder.push('ServiceE');
        }
      }
    }

    @Injectable()
    class ServiceF implements OnInit {
      constructor(
        @Inject([
          Ref(() => ServiceG)
        ]) 
        readonly serviceG: any,
      ) {}

      onInit() {
        // check that serviceG is created and has serviceC property
        if (Object.keys(this.serviceG).length) {
          onInitOrder.push('ServiceF');
        }
      }
    }

    @Injectable()
    class ServiceG implements OnInit {
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

    const injector = Injector.create([
      ServiceA,
      ServiceB,
      ServiceC,
      ServiceD,
      ServiceE,
      ServiceF,
      ServiceG,
    ]).init() as Injector;

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
    // ServiceD first exec `onInit` function because it is the last provider in the chain of resolution
    // ServiceC first go to Services E -> F -> G -> C and then to ServiceD
    expect(onInitOrder).toEqual(['ServiceG', 'ServiceF', 'ServiceE', 'ServiceD', 'ServiceC', 'ServiceB', 'ServiceA']);
  });
});