// test('record wrappers should works with hierarchical modules', async function () {
//   let orderCall: string[] = [];
//   const ParentTestWrapper = createWrapper((_: never) => {
//     return (injector, session, next) => {
//       const value = next(injector, session);
//       orderCall.push('parent');
//       return value;
//     }
//   });
//   const ChildTestWrapper = createWrapper((_: never) => {
//     return (injector, session, next) => {
//       const value = next(injector, session);
//       orderCall.push('child');
//       return value;
//     }
//   });

//   @Injectable()
//   class Service {}

//   @Module({
//     providers: [
//       {
//         provide: Service,
//         useWrapper: ChildTestWrapper(),
//       }
//     ],
//     exports: [Service],
//   })
//   class ChildModule {} 

//   @Module({
//     imports: [
//       ChildModule
//     ],
//     providers: [
//       Service,
//       {
//         provide: Service,
//         useWrapper: ParentTestWrapper(),
//       }
//     ]
//   })
//   class ParentModule {} 

//   const injector = Injector.create(ParentModule).build();

//   const service = injector.get(Service);
// });


import { Injector, Injectable, Inject, Token, Optional, Scope, Path, createNewWrapper, ANNOTATIONS, Memo, Module, InjectionToken, when, Named, NewNamed } from "../../src";

describe('New Wrappers', function() {
  test('should can use useWrapper in injectable as option', function() {
    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Injectable({
      useWrapper: TestWrapper(),
    })
    class Service {}

    const injector = new Injector([
      Service
    ]);

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(called).toEqual(true);
  });

  test('should works with imported wrappers', function() {
    let childCalled: boolean = false;
    const ChildWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        childCalled = true;
        return value;
      }
    });

    let parentCalled: boolean = false;
    const ParentWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        parentCalled = true;
        return value;
      }
    });

    @Injectable()
    class Service {}

    @Module({
      providers: [
        {
          provide: Service,
          useWrapper: ChildWrapper(),
        }
      ],
      exports: [
        Service,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
        {
          provide: Service,
          useWrapper: ParentWrapper(),
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const service = injector.newGet(Service);
    expect(service).toBeInstanceOf(Service);
    expect(childCalled).toEqual(true);
    expect(parentCalled).toEqual(true);
  });

  test('should use definition from imported module', function() {
    const token = new InjectionToken<string>();

    let childCalled: boolean = false;
    const ChildWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        childCalled = true;
        return value;
      }
    });

    @Module({
      providers: [
        {
          provide: token,
          useValue: 'child value',
          when: when.named('child')
        },
        {
          provide: token,
          useWrapper: ChildWrapper(),
        }
      ],
      exports: [
        token,
      ]
    })
    class ChildModule {}

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        {
          provide: token,
          useValue: 'parent value',
          when: when.named('parent')
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const value = injector.newGet(token, NewNamed('child'));
    expect(value).toEqual('child value');
    expect(childCalled).toEqual(true);
  });

  test('should work with @Inject decorator', function() {
    const token = new InjectionToken<string>();

    let called: boolean = false;
    const TestWrapper = createNewWrapper(() => {
      return (session, next) => {
        const value = next(session);
        called = true;
        return value;
      }
    });

    @Module({
      providers: [
        {
          provide: token,
          useValue: 'child value',
          when: when.named('child')
        },
      ],
      exports: [
        token,
      ]
    })
    class ChildModule {}

    @Injectable()
    class Service {
      constructor(
        @Inject(token, [NewNamed('child'), TestWrapper()]) public value: string,
      ) {}
    }

    @Module({
      imports: [
        ChildModule,
      ],
      providers: [
        Service,
        {
          provide: token,
          useValue: 'parent value',
          when: when.named('parent')
        }
      ],
    })
    class ParentModule {}

    const injector = Injector.create(ParentModule).build();

    const service = injector.newGet(Service);
    expect(service.value).toEqual('child value');
    expect(called).toEqual(true);
  });
});
