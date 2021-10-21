import { Injector, Context, NewCtx, when } from "../../src";

describe('useValue', function() {
  test('should works with simple provider', function() {
    const injector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);

    const resolvedToken = injector.newGet<string>('useValue');
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

    const foobar = injector.newGet<string>('useValue');
    expect(foobar).toEqual('foobar');
    const barfoo = injector.newGet<string>('useValue', NewCtx(ctx));
    expect(barfoo).toEqual('barfoo');
  });
});