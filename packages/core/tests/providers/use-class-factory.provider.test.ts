import { Injector, Injectable, Inject, TransientScope } from "../../src";

import type { Provide } from "../../src";

describe('useFactory (class case)', function() {
  test('should work with simple provider', function() {
    @Injectable()
    class TestSevice implements Provide {
      provide() {
        return 'foobar';
      }
    }

    const injector = Injector.create([
      {
        provide: 'useFactory',
        useFactory: TestSevice,
      },
    ])

    const resolvedToken = injector.get<string>('useFactory');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with injections', function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor(
        @Inject('useValue') readonly foobar: string,
      ) {}

      provide() {
        return this.foobar;
      }
    }

    const injector = Injector.create([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
      {
        provide: 'useFactory',
        useFactory: TestSevice,
      },
    ])

    const resolvedToken = injector.get<string>('useFactory');
    expect(resolvedToken).toEqual('foobar');
  });

  test('should work with injections (multiple params)', function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor(
        @Inject('useValue1') readonly foobar: string,
        @Inject('useValue2') readonly barfoo: string,
      ) {}

      provide() {
        return [this.foobar, this.barfoo];
      }
    }

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
        useFactory: TestSevice,
      },
    ])

    const resolvedToken = injector.get<string[]>('useFactory');
    expect(resolvedToken).toEqual(['foobar', 'barfoo']);
  });

  test('should work in async resolution', async function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor(
        @Inject('useValue1') readonly foobar: string,
        @Inject('useValue2') readonly barfoo: string,
      ) {}

      async provide() {
        return [this.foobar, this.barfoo];
      }
    }

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
        useFactory: TestSevice,
      },
    ])

    const resolvedToken = await injector.get<string[]>('useFactory');
    expect(resolvedToken).toEqual(['foobar', 'barfoo']);
  });

  test('should work with overrides', function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor(
        @Inject('useValue1') readonly foobar: string,
      ) {}

      provide() {
        return this.foobar;
      }
    }

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
        useFactory: TestSevice,
        inject: ['useValue2']
      },
    ])

    const resolvedToken = injector.get<TestSevice>('useFactory');
    expect(resolvedToken).toEqual('barfoo');
  });

  test('should reuse on every creatiom this same instance (default scope case)', function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor() {}

      provide() {
        return this;
      }
    }

    const injector = Injector.create([
      {
        provide: 'useFactory',
        useFactory: TestSevice,
      },
    ])

    const resolvedToken1 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken1).toBeInstanceOf(TestSevice);
    const resolvedToken2 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken2).toBeInstanceOf(TestSevice);
    expect(resolvedToken1 === resolvedToken2).toEqual(true);
  });

  test('should create on every creatiom new factory instance (transient scope case)', function() {
    @Injectable()
    class TestSevice implements Provide {
      constructor() {}

      provide() {
        return this;
      }
    }

    const injector = Injector.create([
      {
        provide: 'useFactory',
        useFactory: TestSevice,
        scope: TransientScope,
      },
    ])

    const resolvedToken1 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken1).toBeInstanceOf(TestSevice);
    const resolvedToken2 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken2).toBeInstanceOf(TestSevice);
    expect(resolvedToken1 === resolvedToken2).toEqual(false);
  });

  test('should reuse options passed in Injectable decorator', function() {
    @Injectable({
      scope: TransientScope,
    })
    class TestSevice implements Provide {
      constructor() {}

      provide() {
        return this;
      }
    }

    const injector = Injector.create([
      {
        provide: 'useFactory',
        useFactory: TestSevice,
      },
    ])

    const resolvedToken1 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken1).toBeInstanceOf(TestSevice);
    const resolvedToken2 = injector.get<TestSevice>('useFactory');
    expect(resolvedToken2).toBeInstanceOf(TestSevice);
    expect(resolvedToken1 === resolvedToken2).toEqual(false);
  });
});
