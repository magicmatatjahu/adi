import { Injector, Injectable, Inject, Multi, Named, when, ANNOTATIONS, DefinitionRecord, Factory, Value } from "../../src";

describe('Multi wrapper', function () {
  test('should inject multi providers - token based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject() readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useWrapper: Multi(),
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-1'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-2'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-3'
      },
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers - injection based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Multi()) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useValue: 'multi-provider-1'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-2'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-3'
      },
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers from given token with constraints - token based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Named('multi')) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useWrapper: Multi(),
      },
      {
        provide: MultiProvider,
        useValue: 'multi1',
        when: when.named('multi'),
      },
      {
        provide: MultiProvider,
        useValue: 'multi2',
      },
      {
        provide: MultiProvider,
        useValue: 'multi3',
        when: when.named('multi'),
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual(['multi1', 'multi3']);
  });

  test('should inject multi providers from given token with constraints - injection based useWrapper', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi(Named('multi'))) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'no-multi'
      },
      {
        provide: 'token',
        useValue: 'multi1',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi3',
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual(['multi1', 'multi2']);
  });

  test('should inject multi providers from given token with provided meta key', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi({ metaKey: "metaKey" })) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'multi1',
        annotations: {
          metaKey: 'foobar',
        }
      },
      {
        provide: 'token',
        useValue: 'multi2',
      },
      {
        provide: 'token',
        useValue: 'multi3',
        annotations: {
          metaKey: 'barfoo',
        }
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual({
      foobar: 'multi1',
      barfoo: 'multi3'
    });
  });

  test('should inject multi providers from given token with provided meta key and with constraints', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi({ metaKey: "metaKey" }, Named('multi'))) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'multi1',
        annotations: {
          metaKey: 'foobar',
        }
      },
      {
        provide: 'token',
        useValue: 'multi2',
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: when.named('multi'),
        annotations: {
          metaKey: 'foobar',
        }
      },
      {
        provide: 'token',
        useValue: 'multi3',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi4',
        when: when.named('multi'),
        annotations: {
          metaKey: 'barfoo',
        }
      },
      {
        provide: 'token',
        useValue: 'multi5',
        annotations: {
          metaKey: 'barfoo',
        }
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual({
      foobar: 'multi2',
      barfoo: 'multi4'
    });
  });

  test('should inject multi providers from given token with proper order', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi()) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'multi1',
        annotations: {
          [ANNOTATIONS.ORDER]: 3,
        }
      },
      {
        provide: 'token',
        useValue: 'multi2',
        annotations: {
          [ANNOTATIONS.ORDER]: 4,
        }
      },
      {
        provide: 'token',
        useValue: 'multi3',
        annotations: {
          [ANNOTATIONS.ORDER]: 1,
        }
      },
      {
        provide: 'token',
        useValue: 'multi4',
        annotations: {
          [ANNOTATIONS.ORDER]: 2,
        }
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi).toEqual(['multi3', 'multi4', 'multi1', 'multi2']);
  });

  test('should inject multi providers from given token - inject only definitions', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi({ onlyDefinitions: true })) readonly multi: Array<DefinitionRecord>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: 'multi1',
        annotations: {
          [ANNOTATIONS.ORDER]: 2,
        }
      },
      {
        provide: 'token',
        useValue: 'multi2',
        annotations: {
          [ANNOTATIONS.ORDER]: 3,
        }
      },
      {
        provide: 'token',
        useValue: 'multi3',
        annotations: {
          [ANNOTATIONS.ORDER]: 1,
        }
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi.length).toEqual(3);
    expect(service.multi[0].annotations[ANNOTATIONS.ORDER]).toEqual(1);
    expect(service.multi[1].annotations[ANNOTATIONS.ORDER]).toEqual(2);
    expect(service.multi[2].annotations[ANNOTATIONS.ORDER]).toEqual(3);
  });

  test('should inject multi providers from given token - async resolution case', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi()) readonly multi: Array<DefinitionRecord>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        async useFactory() {
          return 'multi1';
        }
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi2';
        }
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi3';
        }
      }
    ]);

    const service = await injector.getAsync(Service);
    expect(service.multi).toEqual(['multi1', 'multi2', 'multi3']);
  });

  test('should inject multi providers from given token - async resolution case with meta key', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi({ metaKey: "metaKey" })) readonly multi: Array<string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        async useFactory() {
          return 'multi1';
        },
        annotations: {
          metaKey: 'foobar',
        }
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi2';
        },
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi3';
        },
        annotations: {
          metaKey: 'barfoo',
        }
      }
    ]);

    const service = await injector.getAsync(Service);
    expect(service.multi).toEqual({
      foobar: 'multi1',
      barfoo: 'multi3'
    });
  });

  test('should inject multi providers from given token - custom definiton based wrappers', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', Multi()) readonly multi: Array<() => string>,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: 'multi1',
          },
        },
        useWrapper: Value('a.b'),
      },
      {
        provide: 'token',
        useValue: {
          b: {
            c: 'multi2',
          },
        },
        useWrapper: Value('b.c'),
      },
      {
        provide: 'token',
        useValue: {
          c: {
            d: 'multi3',
          },
        },
        useWrapper: Value('c.d'),
      }
    ]);

    const service = injector.get(Service);
    expect(service.multi.length).toEqual(3);
    expect(service.multi[0]).toEqual('multi1');
    expect(service.multi[1]).toEqual('multi2');
    expect(service.multi[2]).toEqual('multi3');
  });

  // TODO: check also case with Factory() wrapper on the definitions
});
