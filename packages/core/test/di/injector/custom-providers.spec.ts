import { c } from "../../../src/di/bindings";
import { Inject, Injectable } from "../../../src/di/decorators";
import { createInjector } from "../../../src/di/injector";
import { useDecorator, useFallback } from "../../../src/di/custom-providers";
import { CONSTRAINTS } from "../../../src/di/constants";
import { Scope } from "../../../src/di/scopes";
import { expect } from 'chai';

describe('Custom providers', () => {
  describe('useFallback', () => {
    it('basic case', async () => {
      class A {}

      const parentInjector = createInjector([
        {
          provide: A,
          useValue: "existingToken",
        },
      ]);
      const childInjector = createInjector([
        useFallback(A)
      ], parentInjector);
  
      const value = await childInjector.resolve(A) as string;
      expect(value).to.be.equal("existingToken");
    });

    it('case when token does not exist in parent injector', async () => {
      class A {}

      const childInjector = createInjector([
        useFallback(A)
      ], createInjector());
  
      const value = await childInjector.resolve(A);
      expect(value instanceof A).to.be.true;
    });

    it('custom providers should works', async () => {
      class A {}

      const childInjector = createInjector([
        useFallback({
          provide: A,
          useValue: "fallbackValue",
        })
      ], createInjector());
  
      const value = await childInjector.resolve(A);
      expect(value).to.be.equal('fallbackValue');
    });

    it('should not override parent provdier by custom provider', async () => {
      class A {}

      const childInjector = createInjector([
        useFallback({
          provide: A,
          useFactory: () => new A(),
        })
      ], createInjector([
        {
          provide: A,
          useValue: "existingToken",
        },
      ]));
  
      const value = await childInjector.resolve(A);
      expect(value).to.be.equal('existingToken');
    });

    it('custom provider should works with scope', async () => {
      class A {}

      const childInjector = createInjector([
        useFallback({
          provide: A,
          useFactory: () => new A(),
          scope: Scope.TRANSIENT,
        })
      ], createInjector());
  
      const firstInstance = await childInjector.resolve(A);
      expect(firstInstance instanceof A).to.be.true;
      const secondInstance = await childInjector.resolve(A);
      expect(secondInstance instanceof A).to.be.true;
      expect(firstInstance).not.to.be.equal(secondInstance);
    });

    it('provider should inheritance metadata from parent provider', async () => {
      class A {}

      const parentInjector = createInjector([
        {
          provide: A,
          useFactory: () => new A(),
          scope: Scope.TRANSIENT,
        },
      ]);
      const childInjector = createInjector([
        useFallback(A)
      ], parentInjector);
  
      const firstInstance = await childInjector.resolve(A);
      expect(firstInstance instanceof A).to.be.true;
      const secondInstance = await childInjector.resolve(A);
      expect(secondInstance instanceof A).to.be.true;
      expect(firstInstance).not.to.be.equal(secondInstance);
    });
  });

  describe.only('useDecorator', () => {
    it('basic case', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "decorated!";
            return decoratee;
          },
        }),
      ]);
      
      const provider = injector.resolveSync("token") as any;
      expect(provider.value).to.be.equal("decorated!");
    });

    it('double decorator', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "decorated";
            return decoratee;
          },
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = decoratee.value + ", and another decoration!";
            return decoratee;
          },
        }),
      ]);
      
      const provider = injector.resolveSync("token") as any;
      expect(provider.value).to.be.equal("decorated, and another decoration!");
    });

    it('triple decorator', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "decorated";
            return decoratee;
          },
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = decoratee.value + ", and another decoration!";
            return decoratee;
          },
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = decoratee.value + " Third decoration...";
            return decoratee;
          },
        }),
      ]);
      
      const provider = injector.resolveSync("token") as any;
      expect(provider.value).to.be.equal("decorated, and another decoration! Third decoration...");
    });

    it('decorate with fallback to parent provider', async () => {
      const parentInjector = createInjector([
        {
          provide: "token",
          useValue: { value: "parent provider" },
        },
      ]);
      const childInjector = createInjector([
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = `decorated from ${decoratee.value}!`;
            return decoratee;
          },
        }),
      ], parentInjector);
      
      const provider = childInjector.resolveSync("token") as any;
      const parentProvider = parentInjector.resolveSync("token") as any;
      // parent value is also changed
      expect(parentProvider.value).to.be.equal("decorated from parent provider!");
      expect(provider.value).to.be.equal("decorated from parent provider!");
    });

    it.skip('decorate with constraints', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        {
          provide: "token",
          useValue: {},
          when: c.named("named"),
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "decorated";
            return decoratee;
          },
          when: c.named("named"),
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "decorated";
            return decoratee;
          },
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value += " named provider!";
            return decoratee;
          },
          when: c.named("named"),
        }),
      ]);
      
      const defaultTarget = injector.resolveSync("token") as any;
      const namedTarget = injector.resolveSync("token", { attrs: { [CONSTRAINTS.NAMED]: "named" } }) as any;
      expect(namedTarget.value).to.be.equal("decorated named provider!");
      // defaultTarget has still `decorated` value
      expect(defaultTarget.value).to.be.equal("decorated");
    });

    it.skip('merge decorator for constraint', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        {
          provide: "token",
          useValue: {},
          when: c.named("named"),
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = "before, ";
            return decoratee;
          },
          when: c.named("named"),
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value = decoratee.value ? decoratee.value + "decorated" : "just decorated";
            return decoratee;
          },
          when: c.always,
        }),
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any) {
            decoratee.value += ", after";
            return decoratee;
          },
          when: c.named("named"),
        }),
      ]);
      
      // const provider = injector.resolveSync("token") as any;
      // expect(provider.value).to.be.equal("decorated");
      // const namedTarget = injector.resolveSync("token", { attrs: { [CONSTRAINTS.NAMED]: "named" } }) as any;
      const provider = injector.resolveSync("token") as any;
      // expect(namedTarget.value).to.be.equal("before, decorated, after");
      expect(provider.value).to.be.equal("just decorated");
    });

    it('case useFactory should works with dependencies', async () => {
      const injector = createInjector([
        {
          provide: "token",
          useValue: {},
        },
        {
          provide: "anotherToken",
          useValue: "anotherValue",
        },
        useDecorator({
          decorate: "token",
          useFactory(decoratee: any, anotherToken: string) {
            decoratee.value = "decorated using " + anotherToken;
            return decoratee;
          },
          inject: ["anotherToken"],
        }),
      ]);

      const provider = injector.resolveSync("token") as any;
      expect(provider.value).to.be.equal("decorated using anotherValue");
    });

    it.skip('case useClass should works', async () => {
      @Injectable()
      class Service {
        constructor(
          @Inject("token") public readonly token: any,
        ) {}
      }

      const injector = createInjector([
        {
          provide: "token",
          useValue: "foobar",
        },
        useDecorator({
          decorate: "token",
          useClass: Service,
        }),
      ]);

      const provider = injector.resolveSync("token") as Service;
      expect(provider.token).to.be.equal("foobar");
    });
  });

  // describe.only('useDecorator', () => {
  //   it.only('basic case', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated!";
  //           return decoratee;
  //         },
  //       }),
  //     ]);
      
  //     const provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated!");
  //   });

  //   it.only('double decorator', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated";
  //           return decoratee;
  //         },
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = decoratee.value + ", and another decoration!";
  //           return decoratee;
  //         },
  //       }),
  //     ]);
      
  //     const provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated, and another decoration!");
  //   });

  //   it.only('triple decorator', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated";
  //           return decoratee;
  //         },
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = decoratee.value + ", and another decoration!";
  //           return decoratee;
  //         },
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = decoratee.value + " Third decoration...";
  //           return decoratee;
  //         },
  //       }),
  //     ]);
      
  //     const provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated, and another decoration! Third decoration...");
  //   });

  //   it('using class as decorator', async () => {
  //     @Injectable()
  //     class Service {
  //       public value: string;

  //       toString() {
  //         return this.value + " from Service provider.";
  //       }
  //     }

  //     const injector = createInjector([
  //       Service,
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated";
  //           return decoratee;
  //         },
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any, service: Service) {
  //           service.value = decoratee.value + " from Service provider.";
  //           return service;
  //         },
  //         inject: [Service],
  //       }),
  //     ]);
      
  //     const provider = await injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated from Service provider.");
  //   });

  //   it('wrap class provider', async () => {
  //     @Injectable()
  //     class Service {
  //       getString() {
  //         return "String from Service";
  //       }
  //     }

  //     @Injectable()
  //     class WrapperService {
  //       public service: Service;

  //       getString() {
  //         return this.service.getString() + " and another String from WrapperService.";
  //       }
  //     }

  //     const injector = createInjector([
  //       Service,
  //       WrapperService,
  //       useDecorator({
  //         decorate: Service,
  //         action(decoratee: any, wrapper: WrapperService) {
  //           wrapper.service = decoratee;
  //           return wrapper;
  //         },
  //         inject: [WrapperService],
  //       }),
  //     ]);
      
  //     const provider = injector.resolveSync(Service);
  //     expect(provider.getString()).to.be.equal("String from Service and another String from WrapperService.");
  //   });

  //   it('decorate with constraints', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       {
  //         provide: "token",
  //         useValue: {},
  //         when: c.named("named"),
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated";
  //           return decoratee;
  //         },
  //         when: c.named("named"),
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "decorated";
  //           return decoratee;
  //         },
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value += " named provider!";
  //           return decoratee;
  //         },
  //         when: c.named("named"),
  //       }),
  //     ]);
      
  //     const defaultTarget = injector.resolveSync("token") as any;
  //     expect(defaultTarget.value).to.be.equal("decorated");
  //     const namedTarget = injector.resolveSync("token", { attrs: { [CONSTRAINTS.NAMED]: "named" } }) as any;
  //     expect(namedTarget.value).to.be.equal("decorated named provider!");
  //     expect(defaultTarget.value).to.be.equal("decorated");
  //   });

  //   it.skip('merge decorator for all and with constraint', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: {},
  //       },
  //       {
  //         provide: "token",
  //         useValue: {},
  //         when: c.named("named"),
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = "before, ";
  //           return decoratee;
  //         },
  //         when: c.named("named"),
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = decoratee.value ? decoratee.value + "decorated" : "decorated";
  //           return decoratee;
  //         },
  //         when: c.always,
  //       }),
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value += ", after";
  //           return decoratee;
  //         },
  //         when: c.named("named"),
  //       }),
  //     ]);
      
  //     // const provider = injector.resolveSync("token") as any;
  //     // expect(provider.value).to.be.equal("decorated");
  //     const namedTarget = injector.resolveSync("token", { attrs: { [CONSTRAINTS.NAMED]: "named" } }) as any;
  //     expect(namedTarget.value).to.be.equal("before, decorated, after");
  //     const provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated");
  //     // expect(provider.value).to.be.equal("decorated");
  //   });

  //   it('decorate with fallback to parent provider', async () => {
  //     const parentInjector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: { value: "parent provider" },
  //       },
  //     ]);
  //     const injector = createInjector([
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           decoratee.value = `decorated from ${decoratee.value}!`;
  //           return decoratee;
  //         },
  //       }),
  //     ], parentInjector);
      
  //     const parentProvider = parentInjector.resolveSync("token") as any;
  //     expect(parentProvider.value).to.be.equal("parent provider");
  //     const provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal("decorated from parent provider!");
  //   });

  //   it('overriding scope', async () => {
  //     const injector = createInjector([
  //       {
  //         provide: "token",
  //         useValue: { value: 0 },
  //       },
  //       useDecorator({
  //         decorate: "token",
  //         action(decoratee: any) {
  //           ++decoratee.value;
  //           return decoratee;
  //         },
  //         scope: Scope.TRANSIENT,
  //       }),
  //     ]);
      
  //     let provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal(1);
  //     provider = injector.resolveSync("token") as any;
  //     expect(provider.value).to.be.equal(2);
  //   });
  // });
});
