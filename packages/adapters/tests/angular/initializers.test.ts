import { Injector, Module } from '@adi/core';
import { Injectable, NgModule, ENVIRONMENT_INITIALIZER, APP_INITIALIZER, inject } from '@angular/core';
import { angularAdapter } from "../../src/angular";

describe('Angular adapter - initializers', function () {
  test('APP_INITIALIZER should work', function () {
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
        {
          provide: APP_INITIALIZER,
          multi: true,
          useValue: function barCreation() {
            inject(BarService);
          }
        },
        {
          provide: APP_INITIALIZER,
          multi: true,
          useValue: function fooCreation() {
            inject(FooService);
          }
        },
      ]
    })
    class AppModule {}

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

  test('ENVIRONMENT_INITIALIZER should work', function () {
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
        {
          provide: ENVIRONMENT_INITIALIZER,
          multi: true,
          useValue: function barCreation() {
            inject(BarService);
          }
        },
        {
          provide: ENVIRONMENT_INITIALIZER,
          multi: true,
          useValue: function fooCreation() {
            inject(FooService);
          }
        },
      ]
    })
    class AppModule {}

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
});
