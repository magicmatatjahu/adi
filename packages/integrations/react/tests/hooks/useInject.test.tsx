import React, { useState, Suspense } from "react";
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Injectable, InjectionToken, Optional, TransientScope } from "@adi/core";

import { Module, useInject } from "../../src";
import { SuspenseError } from "../../src/errors";

import type { FunctionComponent, JSXElementConstructor } from 'react';

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
      <Module input={[Service, DeepService]}>
        <TestComponent />
      </Module>
    )

    expect(screen.getByText('useInject works as hook!')).toBeDefined();
  });
  
  test('should work with hooks - test with Optional hook', async function() {
    @Injectable()
    class Service {}

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service, Optional());

      return (
        <div>
          {service as any || 'injection hooks work!'}
        </div>
      );
    }

    render(
      <Module input={[]}>
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

    const componentToken = InjectionToken.create<JSXElementConstructor<{ text: string }>>();

    const TestComponent: FunctionComponent = () => {
      const Component = useInject(componentToken);

      return (
        <div>
          <Component text='React component' />
        </div>
      );
    }

    render(
      <Module input={[{ provide: componentToken, useValue: DependencyComponent }]}>
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
      useInject(Service);

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
      <Module input={[Service]}>
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
      useInject(Service);

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
      <Module input={[Service]}>
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

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(1);
  });

  test('should preserve the input arguments between rerendering', async function() {
    let onDestroyCalled = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    const ChildComponent: FunctionComponent<{ text: string }> = ({ text }) => {
      useInject(Service, { key: 'value' }, Optional());

      return (
        <div>
          {text}
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
      const [text, setText] = useState('');

      return (
        <div>
          <button onClick={() => setText(previous => previous + 'test')}>Change text</button>
          <ChildComponent text={text} />
        </div>
      );
    }

    render(
      <Module input={[Service]}>
        <TestComponent />
      </Module>
    )

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('test')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(0);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtest')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(0);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtesttest')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(0);
  });

  test('should change injection between rerendering when inject arguments are changed', async function() {
    let onDestroyCalled = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    const ChildComponent: FunctionComponent<{ text: string, annotation: string }> = ({ text, annotation }) => {
      useInject(Service, { key: annotation }, Optional());

      return (
        <div>
          {text}
        </div>
      );
    };

    const TestComponent: FunctionComponent = () => {
      const [text, setText] = useState('');

      return (
        <div>
          <button onClick={() => setText(previous => previous + 'test')}>Change text</button>
          <ChildComponent text={text} annotation={text} />
        </div>
      );
    }

    render(
      <Module input={[Service]}>
        <TestComponent />
      </Module>
    )

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('test')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(1);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtest')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(2);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtesttest')).toBeDefined();

    // wait
    await Promise.resolve();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(3);
  });

  test('should handle async injection using Suspense', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue = useInject<string>('asyncToken', { suspense: true });

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
      <Module 
        input={[
          {
            provide: 'asyncToken',
            async useFactory() {
              return 'async value';
            }
          }
        ]}
      >
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

  test('should handle async injection using Suspense with suspense id', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue = useInject<string>('asyncToken', { suspense: 'some-id' });

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
      <Module 
        input={[
          {
            provide: 'asyncToken',
            async useFactory() {
              return 'async value';
            }
          }
        ]}
      >
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

  // TODO: Fix problem with removing promises from cache 
  test.skip('should handle async injection using Suspense with suspense id (multiple injection to this same component)', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue1 = useInject<string>('asyncToken', { suspense: 'some-id-1' });
      const asyncValue2 = useInject<string>('asyncToken', { suspense: 'some-id-2' });

      return (
        <div>
          {asyncValue1} is rendered!
          {asyncValue2} is rendered!
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

    let nr = 0
    render(
      <Module 
        input={[
          {
            provide: 'asyncToken',
            async useFactory() {
              return `async value ${++nr}`;
            },
            scope: TransientScope,
          },
        ]}
      >
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

  test('should handle async injection using Suspense with suspense id (array injection) with Transient (dynamic) scope', async function() {
    let services: string[] = []

    const AsyncComponent: FunctionComponent<{ suspense: string }> = ({ suspense }) => {
      const asyncValue = useInject<string>('asyncToken', { suspense });
      services.push(asyncValue)

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
            <AsyncComponent suspense="1" />
            <AsyncComponent suspense="2" />
            <AsyncComponent suspense="3" />
            <AsyncComponent suspense="4" />
            <AsyncComponent suspense="5" />
            <AsyncComponent suspense="6" />
            <AsyncComponent suspense="7" />
            <AsyncComponent suspense="8" />
            <AsyncComponent suspense="9" />
            <AsyncComponent suspense="10" />
            <AsyncComponent suspense="11" />
            <AsyncComponent suspense="12" />
            <AsyncComponent suspense="13" />
            <AsyncComponent suspense="14" />
            <AsyncComponent suspense="15" />
          </Suspense>
        </div>
      );
    }

    render(
      <Module 
        input={[
          {
            provide: 'asyncToken',
            async useFactory() {
              return 'async value';
            },
            scope: TransientScope,
          }
        ]}
      >
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

    expect(services).toHaveLength(15);
    expect(screen.queryByText('Resolving async injection...')).toBeNull();
    expect(screen.queryAllByText('async value is rendered!')).toBeDefined();
  });

  test('should throw error when suspense is disabled', async function() {
    const AsyncComponent: FunctionComponent = () => {
      const asyncValue = useInject<string>('asyncToken');

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
        <Module 
          input={[
            {
              provide: 'asyncToken',
              async useFactory() {
                return 'async value';
              },
              scope: TransientScope,
            }
          ]}
        >
          <TestComponent />
        </Module>
      );
    }).toThrow(SuspenseError);
    console.error = nativeConsoleError;
  });
});
