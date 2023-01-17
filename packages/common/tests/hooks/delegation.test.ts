import { Injector, Injectable, Inject, createHook } from "@adi/core";
import { Delegation, DELEGATE_KEY } from "../../src";

describe('Delegation injection hook', function () {
  test('should return normal provider when delegations are not passed', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegation()]) 
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
        session.annotations[DELEGATE_KEY] = { default: 'foobar' };
        return next(session);
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegation()]) 
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

  test('should return deep delegation', function () {
    const TestHook = createHook((key: string, value: string) => {
      return (session, next) => {
        session.annotations[DELEGATE_KEY] = { [key]: value };
        return next(session);
      }
    });

    @Injectable()
    class TestService {
      constructor(
        @Inject([Delegation('deep')]) 
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject([TestHook('default', 'foobar')]) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service, [TestHook('deep', 'barfoo')]) as Service;
    expect(service.service.service).toEqual('barfoo');
  });

  test('should return normal provider when key in delegations does not exist', function () {
    const TestHook = createHook(() => {
      return (session, next) => {
        session.annotations[DELEGATE_KEY] = { default: 'foobar' };
        return next(session);
      }
    });

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Delegation('delegation-does-not-exist')]) 
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
