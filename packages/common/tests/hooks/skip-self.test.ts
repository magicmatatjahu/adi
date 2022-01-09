import { Injector, Injectable, Inject, Optional, Module, Token, ref } from "@adi/core"

import { SkipSelf } from "../../src/hooks";

// TODO: Fix
describe('SkipSelf wrapper', function () {
  test('should inject service from parent injector', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', SkipSelf()) readonly useValue: string,
      ) {}
    }

    const parentInjector = new Injector([
      {
        provide: 'useValue',
        useValue: 'foobar',
      },
    ]);
    const childInjector = new Injector([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector);

    const service = childInjector.get(Service);
    expect(service.useValue).toEqual('foobar');
  });

  test('should inject service from parent injector - not found case (use Optional wrapper to handle error from NilInjector)', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('useValue', [
          Optional(),
          SkipSelf(),
        ])
        readonly useValue: string,
      ) {}
    }

    const parentInjector = new Injector();
    const childInjector = new Injector([
      Service,
      {
        provide: 'useValue',
        useValue: 'barfoo',
      },
    ], parentInjector);

    const service = childInjector.get(Service);
    expect(service.useValue).toEqual(undefined);
  });

  test('should inject service from particular parent injector', async function () {
    @Module({
      providers: [
        {
          provide: 'useFactory',
          useFactory(value: string) {
            return value;
          },
          inject: [[Token('useValue'), SkipSelf(ref(() => ParentModule))]]
        },
      ],
    })
    class GrantChildModule {}

    @Module({
      imports: [
        GrantChildModule,
      ],
      providers: [
        {
          provide: 'useValue',
          useValue: 'child',
        },
      ],
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        {
          provide: 'useValue',
          useValue: 'parent',
        },
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();
    const grandChildInjector = injector.getChild(ChildModule).getChild(GrantChildModule)
    const value = grandChildInjector.get<string>("useFactory");
    expect(value).toEqual('parent');
  });
});