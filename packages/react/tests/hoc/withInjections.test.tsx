import { useState, Component } from "react";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Injectable, TransientScope } from "@adi/core";

import { Module, withInjections } from "../../src";

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

    const TestComponent: React.FunctionComponent<InjectionProps> = ({
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
      <Module module={[Service, DeepService]}>
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
      <Module module={[Service, DeepService]}>
        <InjectedComponent customProp="custom prop" />
      </Module>
    );

    expect(screen.getByText('Class Component works with custom prop!')).toBeDefined();
  });

  test('should not destroy instances when injection have not side effects', async function() {
    jest.useFakeTimers();
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

    const ChildComponent: React.FunctionComponent<ComponentProps> = () => {
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

    const TestComponent: React.FunctionComponent = () => {
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
      <Module module={[Service1, Service2]}>
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

  test('should destroy instances when at least one injection has side effects', async function() {
    jest.useFakeTimers();
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

    const ChildComponent: React.FunctionComponent<ComponentProps> = () => {
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

    const TestComponent: React.FunctionComponent = () => {
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
      <Module module={[Service1, Service2]}>
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

  test('should work with async injections', async function() {
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

    const TestComponent: React.FunctionComponent<ComponentProps> = ({ service, deepService }) => {
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
        module={{
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
});
