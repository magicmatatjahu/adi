import { Injector, Injectable, Inject, Hook } from "@adi/core";

import { Delegation } from "../../src/hooks/delegation";
import { DELEGATE_KEY } from "../../src/hooks/delegate";

describe('Delegation injection hook', function () {
  test('should return normal provider when delegations are not passed', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegation()) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service)
    expect(service.service).toBeInstanceOf(TestService);
  });

  test('should return delegation', function () {
    function TestHook<NextValue>() {
      return Hook<NextValue, NextValue>((session, next) => {
        session.data[DELEGATE_KEY] = { default: 'foobar' };
        return next(session);
      });
    }

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegation('default')) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service, TestHook())
    expect(service.service).toEqual('foobar');
  });

  test('should return deep delegation', function () {
    function TestHook<NextValue>(key: string, value: string) {
      return Hook<NextValue, NextValue>((session, next) => {
        session.data[DELEGATE_KEY] = { [key]: value };
        return next(session);
      });
    }

    @Injectable()
    class TestService {
      constructor(
        @Inject(Delegation('deep')) 
        readonly service: TestService,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(TestHook('default', 'foobar')) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service, TestHook('deep', 'barfoo'))
    expect(service.service.service).toEqual('barfoo');
  });

  test('should return normal provider when key in delegations does not exist', function () {
    function TestHook<NextValue>() {
      return Hook<NextValue, NextValue>((session, next) => {
        session.data[DELEGATE_KEY] = { default: 'foobar' };
        return next(session);
      });
    }

    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Delegation('delegation-does-not-exist')) 
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ])

    const service = injector.getSync(Service, TestHook())
    expect(service.service).toBeInstanceOf(TestService);
  });
});
