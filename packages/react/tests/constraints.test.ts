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
});
