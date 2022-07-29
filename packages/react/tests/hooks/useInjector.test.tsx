import { render, screen } from '@testing-library/react';
import { useContext } from "react";
import { Injectable } from "@adi/core";

import { InjectorContext, Module, useInjector } from "../../src";

describe('useInjector hook', function() {
  test('should work', async function() {
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
      const service = injector.get(Service) as Service;

      return (
        <div>
          {service.deepService.prop} as hook!
        </div>
      );
    }

    render(
      <Module module={[Service, DeepService]}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('useInjector works as hook!')).toBeDefined();
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
      const service = injector.get(Service) as Service;

      return (
        <div>
          {service.deepService.prop} as hook!
        </div>
      );
    }

    render(
      <Module module={[Service, DeepService]}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('useContext(InjectorContext) works as hook!')).toBeDefined();
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


    expect(() => render(<TestComponent />)).toThrow(`Injector context not found. Check if you have connected the ADI Module in the current component's VDOM parent tree.`);
  });
});