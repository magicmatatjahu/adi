import React, { useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Injector, Injectable, Module as ADIModule } from "@adi/core";
import { InjectorStatus } from '@adi/core/lib/enums';

import { Module, useInject, useInjector } from "../../src";

import type { FunctionComponent, PropsWithChildren } from 'react';

describe('Module component', function() {
  test('should work', async function() {
    @Injectable()
    class Service {
      prop: string = "Module works";
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          {service.prop}!
        </div>
      );
    }

    render(
      <Module module={[Service]}>
        <TestComponent />
      </Module>
    );

    expect(screen.getByText('Module works!')).toBeDefined();
  });

  test('should work with hierarchical modules', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);
      const deepService = useInject(DeepService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    render(
      <Module module={[DeepService]}>
        <Module module={[Service]}>
          <TestComponent />
        </Module>
      </Module>
    );

    expect(screen.getByText('Service injected!')).toBeDefined();
    expect(screen.getByText('Deep Service injected!')).toBeDefined();
  });

  test('should work with imports', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @ADIModule({
      providers: [DeepService],
      exports: [DeepService],
    })
    class ChildModule {}

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);
      const deepService = useInject(DeepService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    render(
      <Module 
        module={{
          imports: [ChildModule],
          providers: [Service],
        }}
      >
        <TestComponent />
      </Module>
    );

    expect(screen.getByText('Service injected!')).toBeDefined();
    expect(screen.getByText('Deep Service injected!')).toBeDefined();
  });

  test('should work with proxy modules', async function() {
    @Injectable()
    class RootService {
      prop: string = "Root Service injected";
    }

    @ADIModule({
      providers: [RootService],
    })
    class RootModule {}

    @Injectable()
    class ProxyService {
      prop: string = "Proxy Service injected";
      rootProp: string = "";

      constructor(
        public service: RootService,
      ) {
        this.rootProp = service.prop;
      }
    }

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);
      const proxyService = useInject(ProxyService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{proxyService.prop}!</span>
          <span>{proxyService.rootProp}!</span>
        </div>
      );
    }

    render(
      <Module 
        module={{
          imports: [RootModule],
          providers: [Service],
        }}
      >
        <Module 
          module={{
            imports: [
              {
                extends: RootModule,
                providers: [ProxyService],
                exports: [ProxyService],
              }
            ]
          }}
        >
          <TestComponent />
        </Module>
      </Module>
    );

    expect(screen.getByText('Service injected!')).toBeDefined();
    expect(screen.getByText('Proxy Service injected!')).toBeDefined();
    expect(screen.getByText('Root Service injected!')).toBeDefined();
  });

  test('should not persist the module', async function() {
    let count: number = 0;

    @Injectable()
    class Service {
      prop: string = "Module works";

      constructor() {
        count++;
      }
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          {service.prop}!
        </div>
      );
    }

    render(
      <>
        <Module module={[Service]}>
          <TestComponent />
        </Module>
        <Module module={[Service]}>
          <TestComponent />
        </Module>
        <Module module={[Service]}>
          <TestComponent />
        </Module>
      </>
    );

    expect(count).toEqual(3);
  });

  test('should persist the module with cacheId', async function() {
    let count: number = 0;

    @Injectable()
    class Service {
      prop: string = "Module works";

      constructor() {
        count++;
      }
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          {service.prop}!
        </div>
      );
    }

    render(
      <>
        <Module module={[Service]} cacheId="some-cache-id">
          <TestComponent />
        </Module>
        <Module module={[Service]} cacheId="some-cache-id">
          <TestComponent />
        </Module>
        <Module module={[Service]} cacheId="some-cache-id">
          <TestComponent />
        </Module>
      </>
    );

    expect(count).toEqual(1);
  });

  test('should work with async modules', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Deep Service injected";
    }

    @ADIModule({
      providers: [DeepService],
      exports: [DeepService],
    })
    class ChildModule {}

    @Injectable()
    class Service {
      prop: string = "Service injected";
    }

    const TestComponent: FunctionComponent = () => {
      const service = useInject(Service);
      const deepService = useInject(DeepService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

    render(
      <Module 
        module={{
          imports: [Promise.resolve(ChildModule)],
          providers: [Service],
        }}
        fallback={<div>Fallback is rendered!</div>}
      >
        <TestComponent />
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

  test('should destroy injector after removing component', async function() {
    jest.useFakeTimers();
    let count: number = 0;

    @Injectable()
    class Service {
      prop: string = "Module works";

      constructor() {
        count++;
      }
    }

    let injector: Injector | undefined;
    const ChildComponent: FunctionComponent = () => {
      injector = useInjector();

      return (
        <div>
          Module is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent<PropsWithChildren> = ({ children }) => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {children}
          {renderModule && (
            <Module module={[Service]}>
              <ChildComponent />
            </Module>
          )}
        </>
      );
    }

    render(
      <TestComponent>
        <div>Children are rendered!</div>
      </TestComponent>
    );

    // check if children is rendered
    expect(screen.getByText('Children are rendered!')).toBeDefined();

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Module is rendered!')).toBeNull();

    // check if injector variable is set
    expect(injector).toBeInstanceOf(Injector);

    // wait for all timeouts
    jest.runAllTimers();
    
    // check if injector is destroyed
    expect((injector!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
  });

  test('should not destroy injector if cache id is set', async function() {
    jest.useFakeTimers();
    let count: number = 0;

    @Injectable()
    class Service {
      prop: string = "Module works";

      constructor() {
        count++;
      }
    }

    let injector: Injector | undefined;
    const ChildComponent: FunctionComponent = () => {
      injector = useInjector();

      return (
        <div>
          Module is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent<PropsWithChildren> = ({ children }) => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {children}
          {renderModule && (
            <Module module={[Service]} cacheId='some-cache-id'>
              <ChildComponent />
            </Module>
          )}
        </>
      );
    }

    render(
      <TestComponent>
        <div>Children are rendered!</div>
      </TestComponent>
    );

    // check if children is rendered
    expect(screen.getByText('Children are rendered!')).toBeDefined();

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Module is rendered!')).toBeNull();

    // check if injector variable is set
    expect(injector).toBeInstanceOf(Injector);

    // wait for all timeouts
    jest.runAllTimers();
    
    // check if injector is not destroyed
    expect((injector!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
  });
});
