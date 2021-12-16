import { Injector, Token, Named, when, Ctx, Context, Annotate, Module, ANNOTATIONS, Injectable, Inject } from "../src";

describe('Constraint', function() {
  describe('Named constraint', function() {
    test('should work with wrapper', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.named('bar'),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: [[Token('foobar'), Named('bar')], 'foobar'],
        }
      ]);
  
      const foobar = injector.get('test') as string[];
      expect(foobar[0]).toEqual('bar');
      expect(foobar[1]).toEqual('foo');
    });

    test('should work with inline annotation', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.named('bar'),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: [{ token: 'foobar', annotations: { [ANNOTATIONS.NAMED]: 'bar' } }, 'foobar'],
        }
      ]);
  
      const foobar = injector.get('test') as string[];
      expect(foobar[0]).toEqual('bar');
      expect(foobar[1]).toEqual('foo');
    });

    test('should work with inline annotation - using Inject decorator', function () {
      @Injectable()
      class TestService {
        constructor(
          @Inject('foobar') readonly foo: string,
          @Inject('foobar', { [ANNOTATIONS.NAMED]: 'bar' }) readonly bar: string,
        ) {}
      }

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.named('bar'),
        },
        TestService
      ]);
  
      const foobar = injector.get(TestService);
      expect(foobar.bar).toEqual('bar');
      expect(foobar.foo).toEqual('foo');
    });
  });

  describe('WithContext constraint', function() {
    test('should works', function () {
      const ctx = new Context();

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.withContext(ctx),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [Token('foobar'), Ctx(ctx)]],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Annotated constraint', function() {
    test('should works', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.annotated({
            foo: 'bar',
            bar: 'foo',
          }),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [Token('foobar'), Annotate({ foo: 'bar', bar: 'foo' })]],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Visible constraint', function() {
    test('should works with public visibility', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'public foobar',
          when: when.visible('public'),
        },
      ]);
  
      const foobar = injector.get<string>('foobar');
      expect(foobar).toEqual('public foobar');
    });

    test('should works with public visibility with hierarchical injectors', function () {
      const parentInjector = new Injector([
        {
          provide: 'foobar',
          useValue: 'public foobar',
          when: when.visible('public'),
        },
      ]);
      const childInjector = new Injector([], parentInjector);
  
      const foobar = childInjector.get<string>('foobar');
      expect(foobar).toEqual('public foobar');
    });

    test('should works with protected visibility', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'protected foobar',
          when: when.visible('protected'),
        },
      ]);
  
      const foobar = injector.get<string>('foobar');
      expect(foobar).toEqual('protected foobar');
    });

    test('should works with protected visibility with hierarchical injectors', function () {
      @Module({
        providers: [
          {
            provide: 'foobar',
            useValue: 'protected foobar',
            when: when.visible('protected'),
          },
        ],
        exports: [
          'foobar',
        ]
      })
      class ChildModule1 {}

      @Module()
      class ChildModule2 {}

      @Module({
        imports: [
          ChildModule1,
          ChildModule2,
        ],
      })
      class ParenModule {}

      const injector = Injector.create(ParenModule).build();
  
      const foobar = injector.get<string>('foobar');
      expect(foobar).toEqual('protected foobar');

      const childInjector = injector.selectChild(ChildModule2);
      let value, err;
      try {
        value = childInjector.get<string>('foobar');
      } catch(e) {
        err = e;
      }
      expect(value).toEqual(undefined);
      expect(err === undefined).toEqual(false);
    });

    test('should works with private visibility', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'private foobar',
          when: when.visible('private'),
        },
      ]);
  
      const foobar = injector.get<string>('foobar');
      expect(foobar).toEqual('private foobar');
    });

    test('should works with private visibility with hierarchical injectors - exports case', function () {
      @Module({
        providers: [
          {
            provide: 'foobar',
            useValue: 'private foobar',
            when: when.visible('private'),
          },
        ],
        exports: [
          'foobar',
        ]
      })
      class ChildModule {}

      @Module({
        imports: [
          ChildModule,
        ],
      })
      class ParenModule {}

      const injector = Injector.create(ParenModule).build();
      let value, err;
      try {
        value = injector.get<string>('foobar');
      } catch(e) {
        err = e;
      }
      expect(value).toEqual(undefined);
      expect(err === undefined).toEqual(false);
    });

    test('should works with private visibility with hierarchical injectors - start resolution from imported injector case', function () {
      @Module()
      class ChildModule {}

      @Module({
        imports: [
          ChildModule,
        ],
        providers: [
          {
            provide: 'foobar',
            useValue: 'private foobar',
            when: when.visible('private'),
          },
          {
            provide: 'foobar',
            useValue: 'public foobar',
            when: when.visible('public'),
          },
        ],
      })
      class ParenModule {}

      const injector = Injector.create(ParenModule).build();
      const childInjector = injector.selectChild(ChildModule);
      let value, err;
      try {
        value = childInjector.get<string>('foobar');
      } catch(e) {
        err = e;
      }
      expect(value).toEqual('public foobar');
      expect(err).toEqual(undefined);
    });
  });

  describe('And', function() {
    test('should works', function () {
      const ctx = new Context();

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.and(when.annotated({
            foo: 'bar',
            bar: 'foo',
          }), when.withContext(ctx)),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [Token('foobar'), Annotate({ foo: 'bar', bar: 'foo' }), Ctx(ctx)]],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Or', function() {
    test('should works', function () {
      const ctx = new Context();

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.or(when.annotated({
            abc: 'abc',
            def: 'def',
          }), when.withContext(ctx)),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [Token('foobar'), Annotate({ foo: 'bar', bar: 'foo' }), Ctx(ctx)]],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });


  test('should works with hierarchical injectors', function () {
    const parentInjector = new Injector([
      {
        provide: 'foobar',
        useValue: 'foo',
        when: when.named('foo'),
      },
    ]);
    const childInjector = new Injector([
      {
        provide: 'foobar',
        useValue: 'bar',
        when: when.named('bar'),
      },
    ], parentInjector);

    const childValue = childInjector.get<string>('foobar', Named('bar'));
    const parentValue = childInjector.get<string>('foobar', Named('foo'));
    expect(childValue).toEqual('bar');
    expect(parentValue).toEqual('foo');
  });
});
