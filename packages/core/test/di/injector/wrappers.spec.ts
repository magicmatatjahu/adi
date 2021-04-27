import { c } from "../../../src/di/bindings";
import { createInjector } from "../../../src/di/injector";
import { CONSTRAINTS } from "../../../src/di/constants";
import { expect } from 'chai';

describe.only('Wrapper providers', () => {
  it('single wrapper', async () => {
    class A {
      public foobar = "";
    }

    const injector = createInjector([
      {
        provide: A,
        useValue: new A(),
      },
      {
        provide: A,
        useWrapper: (fn: Function) => (...args: any) => {
          const value = fn(...args);
          value.foobar = "foobar";
          return value;
        },
        when: c.always,
      },
    ]);

    const value = injector.resolveSync(A);
    expect(value).to.be.instanceOf(A);
    expect(value.foobar).to.be.equal("foobar");
  });

  it('two wrappers', async () => {
    class A {
      public order = "";
    }

    const injector = createInjector([
      {
        provide: A,
        useValue: new A(),
      },
      {
        provide: A,
        useWrapper: (fn: Function) => (...args: any) => {
          const value = fn(...args);
          value.order += "first";
          return value;
        },
        when: c.always,
      },
      {
        provide: A,
        useWrapper: (fn: Function) => (...args: any) => {
          const value = fn(...args);
          value.order += ", second";
          return value;
        },
        when: c.always,
      }
    ]);

    const value = injector.resolveSync(A);
    expect(value).to.be.instanceOf(A);
    expect(value.order).to.be.equal("first, second");
  });

  it('wrapper with constraint', async () => {
    class A {
      public foobar = ""; 
    }

    const injector = createInjector([
      {
        provide: A,
        useValue: new A(),
      },
      {
        provide: A,
        useValue: new A(),
        when: c.named('custom'),
      },
      {
        provide: A,
        useWrapper: (fn: Function) => (...args: any) => {
          const value = fn(...args);
          value.foobar = "foobar";
          return value;
        },
        when: c.named('custom'),
      }
    ]);

    let value = injector.resolveSync(A);
    expect(value).to.be.instanceOf(A);
    expect(value.foobar).to.be.equal("");

    value = injector.resolveSync(A, { attrs: { named: 'custom' } });
    expect(value).to.be.instanceOf(A);
    expect(value.foobar).to.be.equal("foobar");
  });

  it('collection wrapper', async () => {
    class A {
      public foobar = ""; 
    }

    class B {
      public foobar = ""; 
    }

    class C {
      public foobar = ""; 
    }

    class D {
      public foobar = ""; 
    }

    const injector = createInjector([
      {
        provide: A,
        useValue: new A(),
      },
      {
        provide: A,
        useValue: new B(),
        when: c.named('custom1'),
      },
      {
        provide: A,
        useValue: new C(),
        when: c.named('custom1'),
      },
      {
        provide: A,
        useValue: new D(),
        when: c.named('custom2'),
      },
      // Function wrapper!
      // {
      //   provide: A,
      //   // named wrapper like @Inject(Named('lol'))
      //   useWrapper: (next) => (record, options, session, sync) => {
      //     const value = () => next(record, options, session, sync);
      //     console.log(options);
      //     return value;
      //   },
      //   when: c.named('custom'),
      // },
      {
        provide: A,
        // named wrapper like @Inject(Named('lol'))
        useWrapper: (next) => (record, options, session, sync) => {
          const value = next(record, options, session, sync);
          console.log(options);
          return value;
        },
        when: c.named('custom'),
      },
      {
        provide: A,
        useWrapper: (next) => (record, options, session, sync) => {
          options.attrs.named = 'custom1'
          const value = next(record, options, session, sync);
          console.log(value)
          return value;
        },
        when: c.named('custom'),
      }
    ]);

    const value = injector.resolveSync(A, { attrs: { named: 'custom' } });
    expect(value).to.be.instanceOf(C);
    // expect(value.foobar).to.be.equal("foobar");
  });
});
