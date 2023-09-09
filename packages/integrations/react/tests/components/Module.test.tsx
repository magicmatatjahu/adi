import React, { Suspense, useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Injector, Injectable, Module as ADIModule, ProviderType, ModuleToken } from "@adi/core";
import { InjectorStatus } from '@adi/core/lib/enums';

import { Module, useInject, useInjector } from "../../src";
import { wait } from '../helpers';

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
      <Module input={[Service]}>
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
      <Module input={[DeepService]}>
        <Module input={[Service]}>
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
        input={{
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
        input={{
          imports: [RootModule],
          providers: [Service],
        }}
      >
        <Module 
          input={{
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
        <Module input={[Service]}>
          <TestComponent />
        </Module>
        <Module input={[Service]}>
          <TestComponent />
        </Module>
        <Module input={[Service]}>
          <TestComponent />
        </Module>
      </>
    );

    expect(count).toEqual(3);
  });

  test('should work with async modules using fallback', async function() {
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
        input={{
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

  test('should work with async modules using Suspense with class module', async function() {
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

    @ADIModule({
      imports: [Promise.resolve(ChildModule)],
      providers: [Service],
    })
    class RootModule {}

    render(
      <Suspense fallback='Fallback is rendered...'>
        <Module 
          input={RootModule}
          suspense={true}
        >
          <TestComponent />
        </Module>
      </Suspense>
    );

    // check if fallback is rendered
    expect(screen.getByText('Fallback is rendered...')).toBeDefined();

    // check if TestComponent is rendered after initialization of injector
    await waitFor(() => {
      expect(screen.getByText('Service injected!')).toBeDefined();
      expect(screen.getByText('Deep Service injected!')).toBeDefined();
    });
  });

  test('should work with async modules using Suspense with ModuleToken', async function() {
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

    const moduleToken = ModuleToken.create({
      imports: [Promise.resolve(ChildModule)],
      providers: [Service],
    })

    render(
      <Suspense fallback='Fallback is rendered...'>
        <Module 
          input={moduleToken}
          suspense={true}
        >
          <TestComponent />
        </Module>
      </Suspense>
    );

    // check if fallback is rendered
    expect(screen.getByText('Fallback is rendered...')).toBeDefined();

    // check if TestComponent is rendered after initialization of injector
    await waitFor(() => {
      expect(screen.getByText('Service injected!')).toBeDefined();
      expect(screen.getByText('Deep Service injected!')).toBeDefined();
    });
  });

  test('should destroy injector after removing component', async function() {
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
            <Module input={[Service]}>
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

    // wait
    await Promise.resolve();
    
    // check if injector is destroyed
    expect((injector!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
  });

  test('should not persist module when input is changed', async function() {
    let count = 0;

    @Injectable()
    class Service {
      constructor() {
        count++;
      }
    }

    let injector1: Injector | undefined;
    let injector2: Injector | undefined;
    let injector3: Injector | undefined;

    const ChildComponent: FunctionComponent = () => {
      const injector = useInjector();
      injector.get(Service)

      if (injector1 === undefined) {
        injector1 = injector
      } else if (injector2 === undefined) {
        injector2 = injector
      } else {
        injector3 = injector;
      }

      return (
        <div>
          Module is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent<PropsWithChildren> = ({ children }) => {
      const [text, setText] = useState('');

      let dependency: ProviderType
      if (text === '') {
        dependency = Service
      } else if (text === 'test') {
        dependency = { provide: Service, useClass: Service }
      } else {
        dependency = Service
      }

      return (
        <Module input={[dependency]}>
          <button onClick={() => setText(previous => previous + 'test')}>Change text</button>
          <ChildComponent />
        </Module>
      );
    }

    render(
      <TestComponent />
    );

    // check if children is rendered
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Module is rendered!')).toBeDefined();

    // check if injector variable is set
    expect(injector1).toBeInstanceOf(Injector);
    expect(injector2).toBeInstanceOf(Injector);
    expect(injector3).toBeInstanceOf(Injector);
    expect(injector1 === injector2).toEqual(false);
    expect(injector1 === injector3).toEqual(false);
    expect(injector2 === injector3).toEqual(false);
    expect(count).toEqual(3);

    // wait
    await Promise.resolve();
    
    // check if injector is destroyed
    expect((injector1!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
    expect((injector2!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
    expect((injector3!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
  });

  test('should not destroy injector if cache is set', async function() {
    let count: number = 0;

    @Injectable()
    class Service {
      constructor() {
        count++;
      }
    }

    let injector1: Injector | undefined;
    let injector2: Injector | undefined;

    const ChildComponent: FunctionComponent = () => {
      const injector = useInjector();
      injector.get(Service)

      if (injector1 === undefined) {
        injector1 = injector
      } else {
        injector2 = injector
      }

      return (
        <div>
          Module is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent<PropsWithChildren> = ({ children }) => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <Module>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {renderModule && (
            <Module input={[Service]} cache='some-cache'>
              <ChildComponent />
            </Module>
          )}
        </Module>
      );
    }

    render(
      <TestComponent />
    );

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Module is rendered!')).toBeNull();

    // try to mount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // check if injector variables is set
    expect(injector1).toBeInstanceOf(Injector);
    expect(injector2).toBeInstanceOf(Injector);
    expect(injector1 === injector2).toEqual(true);
    expect(count).toEqual(1);

    // wait
    await Promise.resolve();
    
    // check if injector is not destroyed
    expect((injector1!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
    expect((injector2!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
  });

  test('should destroy injector if cache is set but parent injector is destroyed', async function() {
    let count: number = 0;

    @Injectable()
    class Service {
      constructor() {
        count++;
      }
    }

    let injector1: Injector | undefined;
    let injector2: Injector | undefined;

    const ChildComponent: FunctionComponent = () => {
      const injector = useInjector();
      injector.get(Service)

      if (injector1 === undefined) {
        injector1 = injector
      } else {
        injector2 = injector
      }

      return (
        <div>
          Module is rendered!
        </div>
      );
    };

    const TestComponent: FunctionComponent<PropsWithChildren> = ({ children }) => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <Module>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {renderModule && (
            <Module>
              <Module input={[Service]} cache='some-cache'>
                <ChildComponent />
              </Module>
            </Module>
          )}
        </Module>
      );
    }

    render(
      <TestComponent />
    );

    // try to render module
    let button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // try to unmount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Module is rendered!')).toBeNull();

    // try to mount injector
    button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Module is rendered!')).toBeDefined();

    // check if injector variables is set
    expect(injector1).toBeInstanceOf(Injector);
    expect(injector2).toBeInstanceOf(Injector);
    expect(injector1 === injector2).toEqual(false);
    expect(count).toEqual(2);

    // wait
    await wait(5);
    
    // check if injector is not destroyed
    expect((injector1!.status & InjectorStatus.DESTROYED) > 0).toEqual(true);
    expect((injector2!.status & InjectorStatus.DESTROYED) > 0).toEqual(false);
  });
});
