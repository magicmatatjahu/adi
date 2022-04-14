import { Injector, Context, Ctx, when } from "../../src";

describe('useValue', function() {
  test('should work with simple provider', function() {
    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]).init() as Injector;

    const resolvedToken = injector.get<string>('useValue');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with custom context', function() {
    const ctx = new Context();

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        useValue: 'barfoo',
        when: when.context(ctx),
      },
    ]).init() as Injector;

    const foobar = injector.get<string>('useValue');
    expect(foobar).toEqual('foobar');
    const barfoo = injector.get<string>('useValue', [Ctx(ctx)]);
    expect(barfoo).toEqual('barfoo');
  });

  test('should work with function as value', function() {
    function testFunction() {}

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: testFunction,
      },
    ]).init() as Injector;

    const fn = injector.get<Function>('useValue');
    expect(fn).toEqual(testFunction);
  });
});