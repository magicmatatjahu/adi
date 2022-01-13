import { render, screen } from '@testing-library/react';
import { useContext } from "react";

import { Injectable } from "@adi/core";

import { InjectorContext, Module, useInjector } from "../../src";

describe('useInjector hook', function() {
  test('should works', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useInjector works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const TestComponent: React.FunctionComponent = () => {
      const injector = useInjector();

      return (
        <div>
          {injector.get(Service).deepService.prop} as hook!
        </div>
      );
    }

    render(
      <Module module={[Service, DeepService]}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useInjector works as hook!' as any)).toBeDefined();
  });

  test('useContext(InjectorContext) should work in this same way as useInjector', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useContext(InjectorContext) works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const TestComponent: React.FunctionComponent = () => {
      const injector = useContext(InjectorContext);

      return (
        <div>
          {injector.get(Service).deepService.prop} as hook!
        </div>
      );
    }

    render(
      <Module module={[Service, DeepService]}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useContext(InjectorContext) works as hook!' as any)).toBeDefined();
  });

  test('should return null without defined in the Node Tree the InjectorContext', async function() {
    const TestComponent: React.FunctionComponent = () => {
      const injector = useInjector();

      return (
        <div>
          InjectorContext is {injector === null ? 'not defined.' : 'defined.'}
        </div>
      );
    }

    render(
      <TestComponent />
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('InjectorContext is not defined.' as any)).toBeDefined();
  });
});
