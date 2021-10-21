import { Injector, NewToken, NewNamed, when, NewCtx, Context, NewLabelled } from "../src";

describe('Constraint', function() {
  describe('Named constraint', function() {
    test('should works', function () {
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
          inject: [[NewToken('foobar'), NewNamed('bar')], 'foobar'],
        }
      ]);
  
      const foobar = injector.newGet('test') as string[];
      expect(foobar[0]).toEqual('bar');
      expect(foobar[1]).toEqual('foo');
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
          inject: ['foobar', [NewToken('foobar'), NewCtx(ctx)]],
        }
      ]);
  
      const foobar = injector.newGet('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Labelled constraint', function() {
    test('should works', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.labelled({
            foo: 'bar',
            bar: 'foo',
          }),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [NewToken('foobar'), NewLabelled({ foo: 'bar', bar: 'foo' })]],
        }
      ]);
  
      const foobar = injector.newGet('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
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
          when: when.and(when.labelled({
            foo: 'bar',
            bar: 'foo',
          }), when.withContext(ctx)),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [NewToken('foobar'), NewLabelled({ foo: 'bar', bar: 'foo' }), NewCtx(ctx)]],
        }
      ]);
  
      const foobar = injector.newGet('test') as string;
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
          when: when.or(when.labelled({
            abc: 'abc',
            def: 'def',
          }), when.withContext(ctx)),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', [NewToken('foobar'), NewLabelled({ foo: 'bar', bar: 'foo' }), NewCtx(ctx)]],
        }
      ]);
  
      const foobar = injector.newGet('test') as string;
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

    const childValue = childInjector.newGet<string>('foobar', NewNamed('bar'));
    const parentValue = childInjector.newGet<string>('foobar', NewNamed('foo'));
    expect(childValue).toEqual('bar');
    expect(parentValue).toEqual('foo');
  });
});
