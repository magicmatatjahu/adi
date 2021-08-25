import { Injector, Injectable, Session } from "../../src";

describe('Session token', function() {
  test('Should works in simple case', function() {
    @Injectable()
    class TestService {
      constructor(
        readonly session1: Session,
        readonly session2: Session,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        readonly session: Session,
      ) {}
    }

    const injector = new Injector([
      TestService,
      Service,
    ]);

    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.session).toBeInstanceOf(Session);
    expect(service.session.getInstance().value).toEqual(service);
    expect(service.service.session1).toBeInstanceOf(Session);
    expect(service.service.session1.getInstance().value).toEqual(service.service);
    expect(service.service.session1 === service.service.session2).toEqual(true);
  });

  test('Should point to appropriate session in factory injection', function() {
    const injector = new Injector([
      {
        provide: 'test',
        useFactory(session: Session) { return session },
        inject: [Session],
      },
    ]);

    const session = injector.get('test') as Session;
    expect(session).toBeInstanceOf(Session);
    expect(session.getInstance().value).toEqual(session);
  });
});