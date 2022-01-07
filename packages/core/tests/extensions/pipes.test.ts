import { Injector, Injectable, Interceptor, createParameterDecorator, Inject, Scope } from "../../src";
import { ExecutionContext } from "../../src/injector/execution-context";

describe('Pipes', function() {
  const TestParam = createParameterDecorator<string>((meta, ctx) => {
    return meta.data + ctx.getArgs(meta.index);
  }, 'body');

  test('should work', function() {
    @Injectable()
    class InterceptorService2 implements Interceptor {
      intercept(context: ExecutionContext, next: Function) {
        // console.log('foobar')
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
      method(@TestParam('foobar') foobar: string) {
        // console.log(foobar);
      }
    }

    const injector = new Injector([Service, InterceptorService1, InterceptorService2]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.method('foobar');
  });

  test('should work with method injection', function() {
    @Injectable({
      scope: Scope.RESOLUTION,
    })
    class DeepResolutionService {
      public date: number = 0;

      constructor() {
        this.date++;
      }

      async method(@TestParam('foobar') foobar: string, @Inject('foobar') injectedValue?: string, @TestParam('lol2') lol2?: string) {
        // console.log(this);
        // console.log(foobar, injectedValue, lol2, this.date);
      }
    }

    @Injectable({
      scope: Scope.RESOLUTION,
    })
    class ResolutionService {
      constructor(
        readonly deepResolutionService1: DeepResolutionService,
        readonly deepResolutionService2: DeepResolutionService,
      ) {}

      async method(@TestParam('foobar') foobar: string, @Inject('foobar') injectedValue?: string) {
        // console.log(this);
        // console.log(foobar, injectedValue);
        this.deepResolutionService1.method('foobar');
        this.deepResolutionService2.method('foobar');
      }
    }

    @Injectable()
    class Service {
      public createdTimes: number = 0;

      constructor(
        readonly resolutionService: ResolutionService,
      ) {
        this.createdTimes++;
      }
    }

    const injector = new Injector([
      Service,
      ResolutionService,
      DeepResolutionService,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);
    service.resolutionService.method('foobar');
  });
});
