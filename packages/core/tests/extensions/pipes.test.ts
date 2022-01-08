import { Injector, Injectable, UsePipes, PipeTransform, ArgumentMetadata, ExecutionContext, Token } from "../../src";

describe('Pipes', function() {
  test('should work as provider', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as wrapper', function() {
    @Injectable()
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(Token(SimplePipe)) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as instance of class', function() {
    class SimplePipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(new SimplePipe()) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work as injection function', function() {
    @Injectable()
    class Service {
      method(@UsePipes({
        transform(value: string, arg, ctx, foobar) {
          if (foobar === 'foobar') {
            return value + ' transformed';
          }
          return value;
        },
        inject: ['foobar'],
      }) foo: string) {
        return foo;
      }
    }

    const injector = new Injector([
      Service,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed');
  });

  test('should work with multiple pipes', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' and overrided';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(SimplePipe1, SimplePipe2) arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed and overrided');
  });

  test('should work with multiple pipes (different types)', function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(@UsePipes(
        SimplePipe1,
        {
          transform(value: string, arg, ctx, foobar) {
            if (foobar === 'foobar') {
              return value + ' by';
            }
            return value;
          },
          inject: ['foobar'],
        },
        SimplePipe2,
      ) arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
      {
        provide: 'foobar',
        useValue: 'foobar',
      }
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar transformed by three pipes');
  });

  test('should work with pipes passed on class togerther with method pipes', function() {
    @Injectable()
    class ClassPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' class';
      }
    }

    @Injectable()
    class MethodPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' method';
      }
    }

    @Injectable()
    class ParameterPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' parameter';
      }
    }

    @UsePipes(ClassPipe)
    @Injectable()
    class Service {
      @UsePipes(MethodPipe)
      method(@UsePipes(ParameterPipe) arg: string) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      ClassPipe,
      MethodPipe,
      ParameterPipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar')).toEqual('foobar class method parameter');
  });

  test('should work with pipes passed on class togerther with method pipes without pipes on parameter', function() {
    @Injectable()
    class ClassPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' class';
      }
    }

    @Injectable()
    class MethodPipe implements PipeTransform {
      transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' method';
      }
    }

    @UsePipes(ClassPipe)
    @Injectable()
    class Service {
      @UsePipes(MethodPipe)
      method(@UsePipes() arg1: string, arg2: string) {
        return arg1 + arg2;
      }
    }

    const injector = new Injector([
      Service,
      ClassPipe,
      MethodPipe,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(service.method('foobar', ' and without parameter')).toEqual('foobar class method and without parameter');
  });

  test('should work with async transform functions', async function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(
        @UsePipes(
          SimplePipe1,
          {
            async transform(value: string) { return value + ' by' },
          },
          SimplePipe2,
        )
        arg: string,
      ) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
    ]);
    const service = injector.get(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method('foobar')).toEqual('foobar transformed by three pipes');
  });

  test('should work with async resolution', async function() {
    @Injectable()
    class SimplePipe1 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' transformed';
      }
    }

    @Injectable()
    class SimplePipe2 implements PipeTransform {
      async transform(value: string, argMetadata: ArgumentMetadata<unknown>, context: ExecutionContext) {
        return value + ' three pipes';
      }
    }

    @Injectable()
    class Service {
      method(
        @UsePipes(
          SimplePipe1,
          {
            async transform(value: string, arg, ctx, foobar) {
              if (foobar === 'foobar') {
                return value + ' by';
              }
              return value;
            },
            inject: ['foobar'],
          },
          SimplePipe2,
        )
        arg: string
      ) {
        return arg;
      }
    }

    const injector = new Injector([
      Service,
      SimplePipe1,
      SimplePipe2,
      {
        provide: 'foobar',
        async useFactory() { return 'foobar' },
      }
    ]);
    const service = await injector.getAsync(Service);
    expect(service).toBeInstanceOf(Service);

    expect(await service.method('foobar')).toEqual('foobar transformed by three pipes');
  });
});






// import { Injector, Injectable, createParamDecorator } from "../../src";

// describe('Pipes', function() {
//   describe('Param decorator', function() {
//     const TestParam =  createParamDecorator(() => {}, { name: 'test-param' });

//     test('should work ', function() {
//       @Injectable()
//       class SimpleGuard implements Guard {
//         canPerform(context: ExecutionContext) {
//           return false;
//         }
//       }
  
//       @Injectable()
//       class Service {
//         @UseGuards(SimpleGuard)
//         method() {
//           return 'foobar';
//         }
//       }
  
//       const injector = new Injector([
//         Service,
//         SimpleGuard,
//       ]);
//       const service = injector.get(Service);
//       expect(service).toBeInstanceOf(Service);
  
//       expect(service.method()).toEqual(undefined);
//     });
//   });

//   test('should work ', function() {
//     @Injectable()
//     class SimpleGuard implements Guard {
//       canPerform(context: ExecutionContext) {
//         return false;
//       }
//     }

//     @Injectable()
//     class Service {
//       @UseGuards(SimpleGuard)
//       method() {
//         return 'foobar';
//       }
//     }

//     const injector = new Injector([
//       Service,
//       SimpleGuard,
//     ]);
//     const service = injector.get(Service);
//     expect(service).toBeInstanceOf(Service);

//     expect(service.method()).toEqual(undefined);
//   });
// });





// import { Injector, Injectable, Interceptor, createParameterDecorator, Inject, Scope } from "../../src";
// import { ExecutionContext } from "../../src/injector/execution-context";

// describe('Pipes', function() {
//   const TestParam = createParameterDecorator<string>((meta, ctx) => {
//     return meta.data + ctx.getArgs(meta.index);
//   }, 'body');

//   test('should work', function() {
//     @Injectable()
//     class InterceptorService2 implements Interceptor {
//       intercept(context: ExecutionContext, next: Function) {
//         // console.log('foobar')
//         next();
//       }
//     }

//     @Injectable()
//     class InterceptorService1 implements Interceptor {
//       intercept(context: ExecutionContext, next: Function) {
//         // console.log(context)
//         next();
//       }
//     }

//     @Injectable()
//     class Service {
//       method(@TestParam('foobar') foobar: string) {
//         // console.log(foobar);
//       }
//     }

//     const injector = new Injector([Service, InterceptorService1, InterceptorService2]);
//     const service = injector.get(Service);
//     expect(service).toBeInstanceOf(Service);
//     service.method('foobar');
//   });

//   test('should work with method injection', function() {
//     @Injectable({
//       scope: Scope.RESOLUTION,
//     })
//     class DeepResolutionService {
//       public date: number = 0;

//       constructor() {
//         this.date++;
//       }

//       async method(@TestParam('foobar') foobar: string, @Inject('foobar') injectedValue?: string, @TestParam('lol2') lol2?: string) {
//         // console.log(this);
//         // console.log(foobar, injectedValue, lol2, this.date);
//       }
//     }

//     @Injectable({
//       scope: Scope.RESOLUTION,
//     })
//     class ResolutionService {
//       constructor(
//         readonly deepResolutionService1: DeepResolutionService,
//         readonly deepResolutionService2: DeepResolutionService,
//       ) {}

//       async method(@TestParam('foobar') foobar: string, @Inject('foobar') injectedValue?: string) {
//         // console.log(this);
//         // console.log(foobar, injectedValue);
//         this.deepResolutionService1.method('foobar');
//         this.deepResolutionService2.method('foobar');
//       }
//     }

//     @Injectable()
//     class Service {
//       public createdTimes: number = 0;

//       constructor(
//         readonly resolutionService: ResolutionService,
//       ) {
//         this.createdTimes++;
//       }
//     }

//     const injector = new Injector([
//       Service,
//       ResolutionService,
//       DeepResolutionService,
//       {
//         provide: 'foobar',
//         useValue: 'foobar',
//       }
//     ]);
//     const service = injector.get(Service);
//     expect(service).toBeInstanceOf(Service);
//     service.resolutionService.method('foobar');
//   });
// });
