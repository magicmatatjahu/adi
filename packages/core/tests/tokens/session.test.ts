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

    const injector = Injector.create([
      TestService,
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.session).toBeInstanceOf(Session);
    expect(service.session.ctx.instance.value).toEqual(service);
    expect(service.service.session1).toBeInstanceOf(Session);
    expect(service.service.session1.ctx.instance.value).toEqual(service.service);
    expect(service.service.session1 === service.service.session2).toEqual(true);
  });

  test('Should point to appropriate session in factory injection', function() {
    const injector = Injector.create([
      {
        provide: 'test',
        useFactory(session: Session) { return session },
        inject: [Session],
      },
    ]).init() as Injector;

    const session = injector.get('test') as Session;
    expect(session).toBeInstanceOf(Session);
    expect(session.ctx.instance.value).toEqual(session);
  });
});