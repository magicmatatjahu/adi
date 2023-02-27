import { Injector, Module } from '@adi/core';
import { Injectable, NgModule } from '@angular/core';
import { angularAdapter } from "../../src/angular";

describe('Angular adapter - modules', function () {
  test('should work with simple graph', function () {
    let fooCreated = false;
    let barCreated = false;

    @Injectable()
    class FooService {
      constructor() {
        fooCreated = true;
      }
    }

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @NgModule({
      providers: [
        FooService,
        BarService,
      ]
    })
    class ChildModule {}

    @NgModule({
      imports: [
        ChildModule,
      ],
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
        readonly barService: BarService,
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

  test('should work with complex graph', function () {
    let fooCreated = false;
    let barCreated = false;

    @Injectable()
    class FooService {
      constructor() {
        fooCreated = true;
      }
    }

    @Injectable()
    class BarService {
      constructor() {
        barCreated = true;
      }
    }

    @NgModule({
      providers: [
        BarService,
      ]
    })
    class ChildModule2 {}

    @NgModule({
      providers: [
        FooService,
      ]
    })
    class ChildModule1 {}

    @NgModule({
      imports: [
        ChildModule1,
        ChildModule2,
      ],
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
        readonly barService: BarService,
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

  test('should work with overriding of providers', function () {
    let fooValue: any = undefined;
    let barValue: any = undefined;

    let fooValue1: any = undefined;
    let barValue1: any = undefined;

    let fooValue2: any = undefined;
    let barValue2: any = undefined;

    @Injectable()
    class FooService {}

    @Injectable()
    class BarService {}

    @NgModule({
      providers: [
        BarService,
      ]
    })
    class ChildModule2 {
      constructor(
        readonly fooService: FooService,
        readonly barService: BarService,
      ) {
        fooValue2 = fooService;
        barValue2 = barService;
      }
    }

    @NgModule({
      providers: [
        FooService,
      ]
    })
    class ChildModule1 {
      constructor(
        readonly fooService: FooService,
        readonly barService: BarService,
      ) {
        fooValue1 = fooService;
        barValue1 = barService;
      }
    }

    @NgModule({
      imports: [
        ChildModule1,
        ChildModule2,
      ],
      providers: [
        {
          provide: BarService,
          useValue: 'barService',
        },
        {
          provide: FooService,
          useValue: 'fooService',
        }
      ],
    })
    class AppModule {
      constructor(
        readonly fooService: FooService,
        readonly barService: BarService,
      ) {
        fooValue = fooService;
        barValue = barService;
      }
    }

    @Module({
      imports: [
        angularAdapter(AppModule),
      ]
    })
    class TestModule {}

    Injector.create(TestModule).init();
    expect(fooValue).toEqual('fooService');
    expect(barValue).toEqual('barService');
    expect(fooValue1).toEqual('fooService');
    expect(barValue1).toEqual('barService');
    expect(fooValue2).toEqual('fooService');
    expect(barValue2).toEqual('barService');
  });
});
