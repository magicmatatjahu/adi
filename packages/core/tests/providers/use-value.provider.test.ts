import { Injector, Context, Ctx, token, when } from "../../src";

describe('useValue', function() {
  test('should work with simple provider', function() {
    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);

    const resolvedToken = injector.get<string>('useValue');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with custom context', function() {
    const ctx = Context.create();

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        useValue: 'barfoo',
        when: when.inContext(ctx),
      },
    ]);

    const foobar = injector.get<string>('useValue');
    expect(foobar).toEqual('foobar');
    const barfoo = injector.get(token<string>('useValue'), Ctx(ctx));
    expect(barfoo).toEqual('barfoo');
  });

  test('should work with function as value', function() {
    function testFunction() {}

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: testFunction,
      },
    ])

    const fn = injector.get<Function>('useValue');
    expect(fn).toEqual(testFunction);
  });
});
