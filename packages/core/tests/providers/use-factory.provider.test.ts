import { Injector, Token } from "../../src";

describe('useFactory', function() {
  test('should work with simple provider', function() {
    const injector = Injector.create([
      {
        provide: 'useFactory',
        useFactory() { return "foobar" },
      },
    ]);

    const resolvedToken = injector.get<string>('useFactory');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with injection array (single param)', function() {
    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useFactory',
        useFactory(foobar) { return foobar },
        inject: ['useValue']
      },
    ]);

    const resolvedToken = injector.get<string>('useFactory');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with injection array (multiple params)', function() {
    const injector = Injector.create([
      {
        provide: 'useValue1',
        useValue: 'foobar',
      },
      {
        provide: 'useValue2',
        useValue: 'barfoo',
      },
      {
        provide: 'useFactory',
        useFactory(foobar, barfoo) { return [foobar, barfoo] },
        inject: ['useValue1', 'useValue2']
      },
    ]);

    const resolvedToken = injector.get<string[]>('useFactory');
    expect(resolvedToken).toEqual(['foobar', 'barfoo']);
  });

  test('should work in async resolution', async function() {
    const injector = Injector.create([
      {
        provide: 'useValue1',
        useValue: 'foobar',
      },
      {
        provide: 'useValue2',
        useValue: 'barfoo',
      },
      {
        provide: 'useFactory',
        async useFactory(foobar, barfoo) { return [foobar, barfoo] },
        inject: ['useValue1', 'useValue2']
      },
    ]);

    const resolvedToken = await injector.get<string[]>('useFactory');
    expect(resolvedToken).toEqual(['foobar', 'barfoo']);
  });

  test('should work with hooks and plain injection item', function() {
    const injector = Injector.create([
      {
        provide: 'useValue1',
        useValue: 'foobar',
      },
      {
        provide: 'useValue2',
        useValue: 'barfoo',
      },
      {
        provide: 'useFactory',
        useFactory(foobar, barfoo) { return [foobar, barfoo] },
        inject: [[Token('useValue1')], { token: 'useValue2' }]
      },
    ]);

    const resolvedToken = injector.get<string[]>('useFactory');
    expect(resolvedToken).toEqual(['foobar', 'barfoo']);
  });
});
