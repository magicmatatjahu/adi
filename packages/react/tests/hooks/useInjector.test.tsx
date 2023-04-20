import React, { render, screen } from '@testing-library/react';
import { useContext } from "react";
import { Injectable } from "@adi/core";

import { InjectorContext, Module, useInjector } from "../../src";
import { NotFoundInjectorError } from '../../src/problems';

import { FunctionComponent } from 'react';

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

    const TestComponent: FunctionComponent = () => {
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

    const TestComponent: FunctionComponent = () => {
      const ctx = useContext(InjectorContext);
      const service = ctx.injector.get(Service) as Service;

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
    const TestComponent: FunctionComponent = () => {
      const injector = useInjector();

      return (
        <div>
          InjectorContext is {injector === null ? 'not defined.' : 'defined.'}
        </div>
      );
    }

    // override console.error native function to not see error in console
    const nativeConsoleError = console.error;
    console.error = () => {};
    expect(() => render(<TestComponent />)).toThrow(NotFoundInjectorError);
    console.error = nativeConsoleError;
  });
});