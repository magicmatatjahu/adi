import React, { useState, Component, Suspense } from "react";
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Injectable, Optional, ProviderType, TransientScope } from "@adi/core";

import { Module, withInjections } from "../../src";
import { SuspenseError } from "../../src/errors";
import { wait } from "../helpers";

import type { FunctionComponent, JSXElementConstructor } from 'react';

describe('withInjections HOC', function() {
  test('should work with Function Component', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Function Component works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    interface InjectionProps {
      service: Service;
      customProp: string;
    }

    const TestComponent: FunctionComponent<InjectionProps> = ({
      service,
      customProp,
    }) => {
      return (
        <div>
          {service.deepService.prop} with {customProp}!
        </div>
      );
    }

    const InjectedComponent = withInjections(TestComponent, {
      service: Service,
    })

    render(
      <Module input={[Service, DeepService]}>
        <InjectedComponent customProp="custom prop" />
      </Module>
    );

    expect(screen.getByText('Function Component works with custom prop!')).toBeDefined();
  });

  test('should work with Class Component', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Class Component works";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    interface InjectionProps {
      service: Service;
      customProp: string;
    }

    class TestComponent extends Component<InjectionProps> {
      render() {
        const { service, customProp } = this.props;

        return (
          <div>
            {service.deepService.prop} with {customProp}!
          </div>
        );
      }
    }

    const InjectedComponent = withInjections(TestComponent, {
      service: Service,
    })

    render(
      <Module input={[Service, DeepService]}>
        <InjectedComponent customProp="custom prop" />
      </Module>
    );

    expect(screen.getByText('Class Component works with custom prop!')).toBeDefined();
  });

  test('should not destroy instances when injection have not side effects', async function() {
    let onDestroyCalled = false;

    @Injectable()
    class Service1 {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    @Injectable()
    class Service2 {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    interface ComponentProps {
      service1: Service1;
      service2: Service2;
    }

    const ChildComponent: FunctionComponent<ComponentProps> = () => {
      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const WithInjectionsComponents = withInjections(ChildComponent, {
      service1: Service1,
      service2: Service2,
    });

    const TestComponent: FunctionComponent = () => {
      const [renderComponent, setRenderComponent] = useState(false);

      return (
        <div>
          <button onClick={() => setRenderComponent(previous => !previous)}>Change state</button>
          {renderComponent && (
            <WithInjectionsComponents />
          )}
        </div>
      );
    }

    render(
      <Module input={[Service1, Service2]}>
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
    await wait();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(false);
  });

  test('should try destroy instances when at least one injection has side effects', async function() {
    let onDestroyCalled = false;

    @Injectable({
      scope: TransientScope,
    })
    class Service1 {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    @Injectable()
    class Service2 {
      onDestroy() {
        onDestroyCalled = true;
      }
    }

    interface ComponentProps {
      service1: Service1;
      service2: Service2;
    }

    const ChildComponent: FunctionComponent<ComponentProps> = () => {
      return (
        <div>
          Child component is rendered!
        </div>
      );
    };

    const WithInjectionsComponents = withInjections(ChildComponent, {
      service1: Service1,
      service2: Service2,
    });

    const TestComponent: FunctionComponent = () => {
      const [renderComponent, setRenderComponent] = useState(false);

      return (
        <div>
          <button onClick={() => setRenderComponent(previous => !previous)}>Change state</button>
          {renderComponent && (
            <WithInjectionsComponents />
          )}
        </div>
      );
    }

    render(
      <Module input={[Service1, Service2]}>
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
    await wait();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(true);
  });

  test('should preserve the injections between rerendering', async function() {
    let onDestroyCalled = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    interface ComponentProps {
      service: Service,
      text: string
    }

    const ChildComponent: FunctionComponent<ComponentProps> = ({ text }) => {
      return (
        <div>
          <span>{text}</span>
        </div>
      );
    }

    const InjectionComponent = withInjections(ChildComponent, {
      service: { token: Service, hooks: [Optional()] }
    });

    const TestComponent: FunctionComponent = () => {
      const [text, setText] = useState('');

      return (
        <div>
          <button onClick={() => setText(previous => previous + 'test')}>Change text</button>
          <InjectionComponent text={text} />
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

  test('should change injection between rerendering when injector is changed', async function() {
    let onDestroyCalled = 0;

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      onDestroy() {
        onDestroyCalled++;
      }
    }

    interface ComponentProps {
      service: Service,
      text: string
    }

    const ChildComponent: FunctionComponent<ComponentProps> = ({ text }) => {
      return (
        <div>
          <span>{text}</span>
        </div>
      );
    }

    const InjectionComponent = withInjections(ChildComponent, {
      service: Service
    });

    const TestComponent: FunctionComponent = () => {
      const [text, setText] = useState('');

      let dependency: ProviderType
      if (text === '') {
        dependency = Service
      } else if (text === 'test') {
        dependency = { provide: Service, useClass: Service }
      } else if (text === 'testtest') {
        dependency = Service
      } else {
        dependency = { provide: Service, useClass: Service }
      }

      return (
        <Module input={[dependency]}>
          <button onClick={() => setText(previous => previous + 'test')}>Change text</button>
          <InjectionComponent text={text} />
        </Module>
      );
    }

    render(
      <TestComponent />
    )

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('test')).toBeDefined();

    // wait
    await wait();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(1);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtest')).toBeDefined();

    // wait
    await wait();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(2);

    // render additional text
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('testtesttest')).toBeDefined();

    // wait
    await wait();

    // check if instance is destroyed
    expect(onDestroyCalled).toEqual(3);
  });

  test('should work with async injections using fallback', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    interface ComponentProps {
      service: Service,
      deepService: DeepService,
    }

    const TestComponent: FunctionComponent<ComponentProps> = ({ service, deepService }) => {
      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    const InjectionComponent = withInjections(TestComponent, {
      service: Service,
      deepService: DeepService,
    }, {
      fallback: (<div>Fallback is rendered!</div>),
    });

    render(
      <Module 
        input={{
          providers: [
            DeepService,
            {
              provide: Service,
              async useFactory() {
                return new Service();
              }
            }
          ],
        }}
      >
        <InjectionComponent />
      </Module>
    );

    // check if fallback is rendered
    expect(screen.getByText('Fallback is rendered!')).toBeDefined();

    // check if TestComponent is rendered after initialization of injector
    await waitFor(() => {
      expect(screen.getByText('Service injected!')).toBeDefined();
      expect(screen.getByText('Deep Service injected!')).toBeDefined();
    });
  });

  test('should work with async injections using Suspense', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @Injectable()
    class AsyncService1 {
      prop: string = "AsyncService1 injected";
    }

    @Injectable()
    class AsyncService2 {
      prop: string = "AsyncService2 injected";
    }

    interface ComponentProps {
      service1: AsyncService1,
      service2: AsyncService2,
      deepService: DeepService,
    }

    const AsyncComponent: FunctionComponent<ComponentProps> = ({ service1, service2, deepService }) => {
      return (
        <div>
          <span>{service1.prop}!</span>
          <span>{service2.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    const AsyncInjectionComponent = withInjections(AsyncComponent, {
      service1: { token: AsyncService1, annotations: { suspense: true } },
      service2: { token: AsyncService2, annotations: { suspense: true } },
      deepService: DeepService,
    });

    const TestComponent: FunctionComponent = () => {
      return (
        <div>
          <Suspense fallback={'Resolving async injections...'}>
            <AsyncInjectionComponent />
          </Suspense>
        </div>
      );
    }

    render(
      <Module 
        input={{
          providers: [
            DeepService,
            {
              provide: AsyncService1,
              async useFactory() {
                return new AsyncService1();
              }
            },
            {
              provide: AsyncService2,
              async useFactory() {
                return new AsyncService2();
              }
            }
          ],
        }}
      >
        <TestComponent />
      </Module>
    );

    // try to render module
    expect(screen.getByText('Resolving async injections...')).toBeDefined();
    expect(screen.queryByText('AsyncService1 injected!')).toBeNull();
    expect(screen.queryByText('AsyncService2 injected!')).toBeNull();
    expect(screen.queryByText('Deep Service injected!')).toBeNull();

    // wait
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByText('Resolving async injections...')).toBeNull();
    expect(screen.getByText('AsyncService1 injected!')).toBeDefined();
    expect(screen.getByText('AsyncService2 injected!')).toBeDefined();
    expect(screen.getByText('Deep Service injected!')).toBeDefined();
  });

  test('should work with async injections using Suspense with suspense id (array injection) with Transient (dynamic) scope', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    interface ComponentProps {
      service: Service,
      deepService: DeepService,
    }

    let services: Service[] = []
    const AsyncComponent: FunctionComponent<ComponentProps> = ({ service, deepService }) => {
      services.push(service)
      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    let id: string = 'a'
    function idGenerator() {
      return id = id + 'a'
    }

    const Components: Array<JSXElementConstructor<any>> = []
    for (let i = 0, l = 15; i < l; i++) {
      Components.push(
        withInjections(AsyncComponent, {
          service: { token: Service, annotations: { suspense: idGenerator() } },
          deepService: DeepService,
        })
      )
    }

    const TestComponent: FunctionComponent = () => {
      return (
        <div>
          <Suspense fallback={'Resolving async injections...'}>
            {Components.map((Component, id) => <Component key={id} />)}
          </Suspense>
        </div>
      );
    }


    render(
      <Module 
        input={{
          providers: [
            DeepService,
            {
              provide: Service,
              async useFactory() {
                return new Service();
              },
              scope: TransientScope,
            }
          ],
        }}
      >
        <TestComponent />
      </Module>
    );

    // try to render module
    expect(screen.getByText('Resolving async injections...')).toBeDefined();
    expect(screen.queryByText('Service injected!')).toBeNull();
    expect(screen.queryByText('Deep Service injected!')).toBeNull();

    // wait
    await act(async () => {
      await Promise.resolve()
    })

    expect(services).toHaveLength(15);
    expect(screen.queryByText('Resolving async injections...')).toBeNull();
    expect(screen.queryAllByText('Service injected!')).toBeDefined();
    expect(screen.queryAllByText('Deep Service injected!')).toBeDefined();
  });

  test('should throw error when suspense is disabled', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    interface ComponentProps {
      service: Service,
      deepService: DeepService,
    }

    const AsyncComponent: FunctionComponent<ComponentProps> = ({ service, deepService }) => {
      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    const AsyncInjectionComponent = withInjections(AsyncComponent, {
      service: Service,
      deepService: DeepService,
    });

    const TestComponent: FunctionComponent = () => {
      return (
        <div>
          <Suspense fallback={'Resolving async injections...'}>
            <AsyncInjectionComponent />
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
        input={{
          providers: [
            DeepService,
            {
              provide: Service,
              async useFactory() {
                return new Service();
              }
            }
          ],
        }}
      >
        <TestComponent />
      </Module>
      );
    }).toThrow(SuspenseError);
    console.error = nativeConsoleError;
  });
});
