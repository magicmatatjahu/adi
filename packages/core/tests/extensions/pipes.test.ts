import { Injector, Injectable, UseInterceptors, Interceptor, createParameterDecorator, Inject, Scope } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Pipes', function() {
  const TestParam = createParameterDecorator<string>((meta, ctx) => {
    return meta.data + ctx.getArgs(meta.index);
  }, 'body');

  test('should work', function() {
    @Injectable()
    class InterceptorService2 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        // console.log('lol')
        next();
      }
    }

    @Injectable()
    class InterceptorService1 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        // console.log(context)
        next();
      }
    }

    @Injectable()
    class Service {
      method(@TestParam('lol') lol: string) {
        // console.log(lol);
      }
    }

    const injector = new Injector([Service, InterceptorService1, InterceptorService2]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method('dupa');
  });

  test('should work with method injection', function() {
    @Injectable({
      scope: Scope.REQUEST,
    })
    class DeepRequestService {
      public date: number = 0;

      constructor() {
        this.date++;
      }

      async method(@TestParam('lol') lol: string, @Inject('foobar') injectedValue?: string, @TestParam('lol2') lol2?: string) {
        // console.log(this);
        // console.log(lol, injectedValue, lol2, this.date);
      }
    }

    @Injectable({
      scope: Scope.REQUEST,
    })
    class RequestService {
      constructor(
        readonly deepRequestService1: DeepRequestService,
        readonly deepRequestService2: DeepRequestService,
      ) {}

      async method(@TestParam('lol') lol: string, @Inject('foobar') injectedValue?: string) {
        // console.log(this);
        // console.log(lol, injectedValue);
        this.deepRequestService1.method('dupa');
        this.deepRequestService2.method('dupa');
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly requestService: RequestService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = new Injector([
      Service,
      RequestService,
      DeepRequestService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.requestService.method('dupa');
  });
});
