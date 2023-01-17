import { Injector, Injectable, Inject, createHook } from "@adi/core";
import { Delegate, DELEGATION_KEY } from "../../src";

describe('Delegate injection hook', function () {
  test('should return normal provider when delegations are not passed', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegate()]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should return delegation', function () {
    const TestHook = createHook(() => {
      return (session, next) => {
        session.annotations[DELEGATION_KEY] = { default: 'foobar' };
        return next(session);
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegate()]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service, [TestHook()]) as Service;
    expect(service.service).toEqual('foobar');
  });

  test('should return normal provider when key in delegations does not exist', function () {
    const TestHook = createHook(() => {
      return (session, next) => {
        session.annotations[DELEGATION_KEY] = { default: 'foobar' };
        return next(session);
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegate('delegation-does-not-exist')]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service, [TestHook()]) as Service;
    expect(service.service).toBeInstanceOf(TestService);
  });
});