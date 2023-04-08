import { useState } from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import { Injectable, Optional, TransientScope } from "@adi/core";

import { Module, useInject, createComponentToken } from "../../src";

describe('useInject hook', function() {
  test('should work', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useInject works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const TestComponent: React.FunctionComponent = () => {
      const service = useInject(Service);

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

    expect(screen.getByText('useInject works as hook!')).toBeDefined();
  });
  
  test('should work with hooks - test with Optional hook', async function() {
    @Injectable()
    class Service {}

    const TestComponent: React.FunctionComponent = () => {
      const service = useInject<Service>(Service, [Optional()]);

      return (
        <div>
          {service as any || 'injection hooks work!'}
        </div>
      );
    }

    render(
      <Module module={[]}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('injection hooks work!')).toBeDefined();
  });

  test('should be able to inject normal React components', async function() {
    const DependencyComponent: React.FunctionComponent<{ text: string }> = ({ text }) => {
      return (
        <div>
          {text} is injected!
        </div>
      );
    };

    const componentToken = createComponentToken<{ text: string }>();

    const TestComponent: React.FunctionComponent = () => {
      const Component = useInject(componentToken);

      return (
        <div>
          <Component text='React component' />
        </div>
      );
    }

    render(
      <Module module={[{ provide: componentToken, useValue: DependencyComponent }]}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('React component is injected!')).toBeDefined();
  });

  test('should not destroy when injection has not side effects', async function() {
    jest.useFakeTimers();
    let onDestroyCalled = false;

    @Injectable()
    class Service {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    const ChildComponent: React.FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const TestComponent: React.FunctionComponent = () => {
      const [renderComponent, setRenderComponent] = useState(false);

      return (
        <div>
          <button onClick={() => setRenderComponent(previous => !previous)}>Change state</button>
          {renderComponent && (
            <ChildComponent />
          )}
        </div>
      );
    }

    render(
      <Module module={[Service]}>
        <TestComponent />
      </Module>
    )

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Child component is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Child component is rendered!')).toBeNull();

    // wait for all timeouts
    jest.runAllTimers();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(false);
  });

  test('should not destroy when injection has not side effects', async function() {
    jest.useFakeTimers();
    let onDestroyCalled = false;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    const ChildComponent: React.FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const TestComponent: React.FunctionComponent = () => {
      const [renderComponent, setRenderComponent] = useState(false);

      return (
        <div>
          <button onClick={() => setRenderComponent(previous => !previous)}>Change state</button>
          {renderComponent && (
            <ChildComponent />
          )}
        </div>
      );
    }

    render(
      <Module module={[Service]}>
        <TestComponent />
      </Module>
    )

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Child component is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Child component is rendered!')).toBeNull();

    // wait for all timeouts
    jest.runAllTimers();
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(true);
  });
});
