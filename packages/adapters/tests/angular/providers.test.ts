import { Injector, Module } from '@adi/core';
import { Injectable, NgModule, inject, Inject, Optional, InjectionToken } from '@angular/core';
import { angularAdapter } from "../../src/angular";

describe('Angular adapter - providers', function () {
  test('type provider should work', function () {
    let fooCreated = false;
    let barCreated = false;

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {
      constructor(
        readonly barService: BarService,
      ) {
        fooCreated = true;
      }
    }

    @NgModule({
      providers: [
        FooService,
        BarService,
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {}
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
  });

  test('type provider should work with injection decorators', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency = undefined;

    @Injectable()
    class TestService {}

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {
      constructor(
        @Inject(BarService) readonly barService: TestService,
        @Optional() readonly optional: any,
      ) {
        fooCreated = true;
        optionalDependency = optional;
      }
    }

    @NgModule({
      providers: [
        FooService,
        BarService,
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {}
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('type provider should work with inject function', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency: any = undefined;

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {
      constructor() {
        fooCreated = true;
        inject(BarService);
        optionalDependency = inject(Object, { optional: true });
      }
    }

    @NgModule({
      providers: [
        FooService,
        BarService,
      ]
    })
    class AppModule {
      constructor() {
        inject(FooService);
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('type provider should work as treeshakable provider', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency: any = undefined;

    @Injectable({
      providedIn: 'any',
    })
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable({
      providedIn: 'any',
    })
    class FooService {
      constructor() {
        fooCreated = true;
        inject(BarService);
        optionalDependency = inject(Object, { optional: true });
      }
    }

    @NgModule()
    class AppModule {
      constructor() {
        inject(FooService);
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('factory provider should work', function () {
    let fooCreated = false;
    let barCreated = false;

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {}

    @NgModule({
      providers: [
        {
          provide: FooService,
          useFactory(bar: BarService) {
            fooCreated = true;
            return bar;
          },
          deps: [BarService],
        },
        BarService,
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {}
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
  });

  test('factory provider should work with injection decorators', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency = undefined;

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {}

    @NgModule({
      providers: [
        {
          provide: FooService,
          useFactory(bar: BarService, optional: any) {
            fooCreated = true;
            optionalDependency = optional;
            return bar;
          },
          deps: [BarService, [Object, new Optional()]],
        },
        BarService,
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {}
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('factory provider should work with inject function', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency: any = undefined;

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @Injectable()
    class FooService {}

    @NgModule({
      providers: [
        {
          provide: FooService,
          useFactory() {
            fooCreated = true;
            inject(BarService);
            optionalDependency = inject(Object, { optional: true });
          },
        },
        BarService,
      ]
    })
    class AppModule {
      constructor() {
        inject(FooService);
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('value provider should work', function () {
    let value: any;

    class BarService {}
    class FooService {}

    @NgModule({
      providers: [
        {
          provide: FooService,
          useValue: BarService,
        },
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {
        value = fooService;
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(value).toEqual(BarService);
  });

  test('existing provider should work', function () {
    let value: any;

    @Injectable()
    class BarService {}
    class FooService {}

    @NgModule({
      providers: [
        BarService,
        {
          provide: FooService,
          useExisting: BarService,
        },
      ]
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
      ) {
        value = fooService;
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(value).toBeInstanceOf(BarService);
  });

  test('injection token should', function () {
    let value: any;
    const FooService = new InjectionToken('...');

    @NgModule({
      providers: [
        {
          provide: FooService,
          useValue: 'foobar',
        }
      ]
    })
    class AppModule {
      constructor() {
        value = inject(FooService);
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(value).toEqual('foobar');
  });

  test('injection token should work as treeshakable provider', function () {
    let fooCreated = false;
    let barCreated = false;
    let optionalDependency: any = undefined;

    @Injectable({
      providedIn: 'any',
    })
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    const FooService = new InjectionToken('...', {
      providedIn: 'any',
      factory() {
        fooCreated = true;
        inject(BarService);
        optionalDependency = inject(Object, { optional: true });
      }
    })

    @NgModule()
    class AppModule {
      constructor() {
        inject(FooService);
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooCreated).toEqual(true);
    expect(barCreated).toEqual(true);
    expect(optionalDependency).toEqual(null);
  });

  test('should work multi injection token', function () {
    let value: any = undefined;
    const MultiToken = new InjectionToken('...');

    @NgModule({
      providers: [
        {
          provide: MultiToken,
          multi: true,
          useValue: 'foo',
        },
        {
          provide: MultiToken,
          multi: true,
          useValue: 'bar',
        }
      ]
    })
    class AppModule {
      constructor(
        @Inject(MultiToken) multi: any[],
      ) {
        value = multi;
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(value).toEqual(['foo', 'bar']);
  });
});
