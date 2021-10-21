import { Injector, Context, Ctx, when } from "../../src";

describe('useValue', function() {
  test('should works with simple provider', function() {
    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);

    const resolvedToken = injector.get<string>('useValue');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should works with custom context', function() {
    const ctx = new Context();

    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useValue',
        useValue: 'barfoo',
        when: when.withContext(ctx),
      },
    ]);

    const foobar = injector.get<string>('useValue');
    expect(foobar).toEqual('foobar');
    const barfoo = injector.get<string>('useValue', Ctx(ctx));
    expect(barfoo).toEqual('barfoo');
  });
});