import React, { useState, Suspense } from "react";
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Injectable, Optional, TransientScope } from "@adi/core";

import { Module, useInject, createComponentToken } from "../../src";
import { UndefinedSuspenseIdError } from "../../src/problems";

import { FunctionComponent } from 'react';

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

    const TestComponent: FunctionComponent = () => {
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

    const TestComponent: FunctionComponent = () => {
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
    const DependencyComponent: FunctionComponent<{ text: string }> = ({ text }) => {
      return (
        <div>
          {text} is injected!
        </div>
      );
    };

    const componentToken = createComponentToken<{ text: string }>();

    const TestComponent: FunctionComponent = () => {
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
    let onDestroyCalled = 0;

    @Injectable()
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    const ChildComponent: FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
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

    // wait
    await Promise.resolve();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Child component is rendered!')).toBeNull();

    // wait
    await Promise.resolve();
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(0);
  });

  test('should destroy when injection has side effects', async function() {
    let onDestroyCalled = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    const ChildComponent: FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
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

    // wait
    await Promise.resolve();

    // try to unmount component
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Child component is rendered!')).toBeNull();

    // wait
    await Promise.resolve();
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(1);
  });

  test('should handle async injection using Suspense', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue = useInject('asyncToken', { suspenseId: 'async-id' });

      return (
        <div>
          {asyncValue} is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
      return (
        <div>
          <Suspense fallback={'Resolving async injection...'}>
            <AsyncComponent />
          </Suspense>
        </div>
      );
    }

    render(
      <Module module={[
        {
          provide: 'asyncToken',
          async useFactory() {
            return 'async value';
          }
        }
      ]}>
        <TestComponent />
      </Module>
    );

    // try to render module
    expect(screen.getByText('Resolving async injection...')).toBeDefined();
    expect(screen.queryByText('async value is rendered!')).toBeNull();

    // wait
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByText('Resolving async injection...')).toBeNull();
    expect(screen.getByText('async value is rendered!')).toBeDefined();
  });

  test('should throw error when suspenseId is not passed during async injection', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue = useInject('asyncToken');

      return (
        <div>
          {asyncValue} is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
      return (
        <div>
          <Suspense fallback={'Resolving async injection...'}>
            <AsyncComponent />
          </Suspense>
        </div>
      );
    }

    // override console.error native function to not see error in console
    const nativeConsoleError = console.error;
    console.error = () => {};
    expect(() => {
      render(
        <Module module={[
          {
            provide: 'asyncToken',
            async useFactory() {
              return 'async value';
            }
          }
        ]}>
          <TestComponent />
        </Module>
      );
    }).toThrow(UndefinedSuspenseIdError);
    console.error = nativeConsoleError;
  });
});
