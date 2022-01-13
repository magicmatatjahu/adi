import { render, screen } from '@testing-library/react';

import { Injectable, Provider } from "@adi/core";
import { Transform } from "@adi/common";

import { Module, useInjections } from "../../src";

describe('useInjections hook', function() {
  test('should works', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useInjections works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const providers: Provider[] = [
      Service,
      DeepService,
      {
        provide: 'useFactory',
        useFactory: (useValue: string) => {
          return useValue + ' from useFactory';
        },
        inject: ['useValue']
      },
      {
        provide: 'useValue',
        useValue: 'useValue'
      }
    ]

    const TestComponent: React.FunctionComponent = () => {
      const [service, useFactory, useValue] = useInjections(Service, 'useFactory', 'useValue');

      return (
        <div>
          <span>{service.deepService.prop} as hook!</span>
          <span>{useFactory} is injected!</span>
          <span>{useValue} is injected!</span>
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useInjections works as hook!' as any)).toBeDefined();
    expect(screen.getByText('useValue from useFactory is injected!' as any)).toBeDefined();
    expect(screen.getByText('useValue is injected!' as any)).toBeDefined();
  });

  test('should works with wrappers', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useInjections works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const providers: Provider[] = [
      Service,
      DeepService,
      {
        provide: 'useFactory',
        useFactory: (useValue: string) => {
          return useValue + ' from useFactory';
        },
        inject: ['useValue']
      },
      {
        provide: 'useValue',
        useValue: 'useValue'
      },
      {
        provide: 'forTransform',
        useValue: ' and transformed by forTransform'
      }
    ]

    const transformWrapper = {
      transform(value: string, forTransform: string) { return value + forTransform },
      inject: ['forTransform'],
    }
    const TestComponent: React.FunctionComponent = () => {
      const [service, useFactory, useValue] = useInjections(Service, { token: 'useFactory', wrapper: Transform(transformWrapper) }, 'useValue');

      return (
        <div>
          <span>{service.deepService.prop} as hook!</span>
          <span>{useFactory} is injected!</span>
          <span>{useValue} is injected!</span>
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useInjections works as hook!' as any)).toBeDefined();
    expect(screen.getByText('useValue from useFactory and transformed by forTransform is injected!' as any)).toBeDefined();
    expect(screen.getByText('useValue is injected!' as any)).toBeDefined();
  });
});
