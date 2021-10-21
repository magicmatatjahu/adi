import { Injector, Injectable, Inject, Module, Multi, Named, when, ANNOTATIONS, Path, NewMulti, NewNamed, NewPath } from "../../src";

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
        useWrapper: NewMulti(),
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers - injection based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewMulti()) readonly multi: MultiProvider,
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers from given token with constraints - token based useWrapper', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject(NewNamed('multi')) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useWrapper: NewMulti(),
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual(['multi1', 'multi3']);
  });

  test('should inject multi providers from given token with constraints - injection based useWrapper', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [
          NewMulti(),
          NewNamed('multi'),
        ])
        readonly multi: Array<string>,
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual(['multi1', 'multi2']);
  });

  test('should inject multi providers from given token with provided meta key', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti({ metaKey: "metaKey" })) readonly multi: Array<string>,
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual({
      foobar: 'multi1',
      barfoo: 'multi3'
    });
  });

  test('should inject multi providers from given token with provided meta key and with constraints', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [
          NewMulti({ metaKey: "metaKey" }),
          NewNamed('multi'), 
        ]) 
        readonly multi: Array<string>,
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual({
      foobar: 'multi2',
      barfoo: 'multi4'
    });
  });

  test('should inject multi providers from given token with proper order', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti()) readonly multi: Array<string>,
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

    const service = injector.newGet(Service);
    expect(service.multi).toEqual(['multi3', 'multi4', 'multi1', 'multi2']);
  });

  test('should inject multi providers from given token - async resolution case', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti()) readonly multi: Array<string>,
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

    const service = await injector.newGetAsync(Service);
    expect(service.multi).toEqual(['multi1', 'multi2', 'multi3']);
  });

  test('should inject multi providers from given token - async resolution case with meta key', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti({ metaKey: "metaKey" })) readonly multi: Array<string>,
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

    const service = await injector.newGetAsync(Service);
    expect(service.multi).toEqual({
      foobar: 'multi1',
      barfoo: 'multi3'
    });
  });

  test('should inject multi providers from given token - custom definiton based wrappers', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti()) readonly multi: Array<string>,
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
        useWrapper: NewPath('a.b'),
      },
      {
        provide: 'token',
        useValue: {
          b: {
            c: 'multi2',
          },
        },
        useWrapper: NewPath('b.c'),
      },
      {
        provide: 'token',
        useValue: {
          c: {
            d: 'multi3',
          },
        },
        useWrapper: NewPath('c.d'),
      }
    ]);

    const service = injector.newGet(Service);
    expect(service.multi.length).toEqual(3);
    expect(service.multi[0]).toEqual('multi1');
    expect(service.multi[1]).toEqual('multi2');
    expect(service.multi[2]).toEqual('multi3');
  });

  test('should inject multi providers from imported modules', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', NewMulti()) readonly multi: Array<string>,
      ) {}
    }

    @Module({
      providers: [
        {
          provide: 'token',
          useValue: 'childMulti2-1',
        },
        {
          provide: 'token',
          useValue: 'childMulti2-2',
        },
        {
          provide: 'token',
          useValue: 'childMulti2-3',
        },
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule2 {}

    @Module({
      providers: [
        {
          provide: 'token',
          useValue: 'childMulti1-1',
        },
        {
          provide: 'token',
          useValue: 'childMulti1-2',
        },
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule1 {}

    @Module({
      imports: [
        ChildModule1,
        ChildModule2,
      ],
      providers: [
        Service,
        {
          provide: 'token',
          useValue: 'multi1',
        },
        {
          provide: 'token',
          useValue: 'multi2',
        },
        {
          provide: 'token',
          useValue: 'multi3',
        }
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();
    const service = injector.newGet(Service);
    expect(service.multi.length).toEqual(8);
    expect(service.multi).toEqual([
      'multi1',
      'multi2',
      'multi3',
      'childMulti1-1',
      'childMulti1-2',
      'childMulti2-1',
      'childMulti2-2',
      'childMulti2-3',
    ]);
  });

  test('should inject multi providers from imported modules with constraints', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [
          NewMulti(),
          NewNamed('multi'),
        ]) 
        readonly multi: Array<string>,
      ) {}
    }

    @Module({
      providers: [
        {
          provide: 'token',
          useValue: 'childMulti2-1',
        },
        {
          provide: 'token',
          useValue: 'childMulti2-2',
          when: when.named('multi'),
        },
        {
          provide: 'token',
          useValue: 'childMulti2-3',
        },
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule2 {}

    @Module({
      providers: [
        {
          provide: 'token',
          useValue: 'childMulti1-1',
        },
        {
          provide: 'token',
          useValue: 'childMulti1-2',
          when: when.named('multi'),
        },
      ],
      exports: [
        'token',
      ]
    })
    class ChildModule1 {}

    @Module({
      imports: [
        ChildModule1,
        ChildModule2,
      ],
      providers: [
        Service,
        {
          provide: 'token',
          useValue: 'multi1',
          when: when.named('multi'),
        },
        {
          provide: 'token',
          useValue: 'multi2',
        },
        {
          provide: 'token',
          useValue: 'multi3',
          when: when.named('multi'),
        }
      ]
    })
    class MainModule {}

    const injector = Injector.create(MainModule).build();
    const service = injector.newGet(Service);
    expect(service.multi.length).toEqual(4);
    expect(service.multi).toEqual([
      'multi1',
      'multi3',
      'childMulti1-2',
      'childMulti2-2',
    ]);
  });

  // TODO: check also case with Factory() wrapper on the definitions
});
