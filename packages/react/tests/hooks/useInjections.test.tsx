import { render, screen } from '@testing-library/react';
import { Injectable, Optional, Provider } from "@adi/core";

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
      const [service, useFactory, useValue] = useInjections<Service, string, string>(Service, 'useFactory', 'useValue');

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

    expect(screen.getByText('useInjections works as hook!')).toBeDefined();
    expect(screen.getByText('useValue from useFactory is injected!')).toBeDefined();
    expect(screen.getByText('useValue is injected!')).toBeDefined();
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
    ]

    const TestComponent: React.FunctionComponent = () => {
      const [service, useFactory, optional, useValue] = useInjections<Service, string, string, string>(Service, 'useFactory', { token: 'not existing', hooks: [Optional('optional fallback')] }, 'useValue');

      return (
        <div>
          <span>{service.deepService.prop} as hook!</span>
          <span>{useFactory} is injected!</span>
          <span>{optional} is injected!</span>
          <span>{useValue} is injected!</span>
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('useInjections works as hook!')).toBeDefined();
    expect(screen.getByText('useValue from useFactory is injected!')).toBeDefined();
    expect(screen.getByText('optional fallback is injected!')).toBeDefined();
    expect(screen.getByText('useValue is injected!')).toBeDefined();
  });
});