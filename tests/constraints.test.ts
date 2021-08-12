import { Injector, Token, Named, when, Ctx, Context, Labelled } from "../src";

describe('Constraint', function() {
  describe('Named constraint', function() {
    test('should works', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.named('bar'),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: [Token('foobar', Named('bar')), 'foobar'],
        }
      ]);
  
      const foobar = injector.get('test') as string[];
      expect(foobar[0]).toEqual('bar');
      expect(foobar[1]).toEqual('foo');
    });
  });

  describe('WithContext constraint', function() {
    test('should works', function () {
      const ctx = new Context();

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.withContext(ctx),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', Token('foobar', Ctx(ctx))],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Labelled constraint', function() {
    test('should works', function () {
      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.labelled({
            foo: 'bar',
            bar: 'foo',
          }),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', Token('foobar', Labelled({ foo: 'bar', bar: 'foo' }))],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });

  describe('Concat', function() {
    test('should works', function () {
      const ctx = new Context();

      const injector = new Injector([
        {
          provide: 'foobar',
          useValue: 'foo',
        },
        {
          provide: 'foobar',
          useValue: 'bar',
          when: when.concat(when.labelled({
            foo: 'bar',
            bar: 'foo',
          }), when.withContext(ctx)),
        },
        {
          provide: 'test',
          useFactory() { return arguments },
          inject: ['foobar', Token('foobar', Labelled({ foo: 'bar', bar: 'foo' }, Ctx(ctx)))],
        }
      ]);
  
      const foobar = injector.get('test') as string;
      expect(foobar[0]).toEqual('foo');
      expect(foobar[1]).toEqual('bar');
    });
  });
});
