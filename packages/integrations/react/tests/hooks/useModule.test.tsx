import React, { useState, Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Injector, Injectable, Module as ADIModule, ModuleToken, ProviderType } from "@adi/core";
import { InjectorStatus } from '@adi/core/lib/enums';

import { Module, useModule } from "../../src";
import { wait } from '../helpers';

import type { FunctionComponent } from 'react';

describe('useModule hook', function() {
  test('should work', async function() {
    @Injectable()
    class Service {
      prop: string = "useModule works";
    }

    const TestComponent: FunctionComponent = () => {
      const injector = useModule([Service]);
      const service = injector.getSync(Service)

      return (
        <div>
          {service.prop}!
        </div>
      );
    }

    render(
      <TestComponent />
    );

    expect(screen.getByText('useModule works!')).toBeDefined();
  });

  test('should work with parent injector', async function() {
    @Injectable()
    class Service {
      prop: string = "useModule works";
    }

    const TestComponent: FunctionComponent = () => {
      const injector = useModule();
      const service = injector.getSync(Service)

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

    expect(screen.getByText('useModule works!')).toBeDefined();
  });

  test('throw error when provider does not exist in injectors chain', async function() {
    @Injectable()
    class Service {
      prop: string = "useModule works";
    }

    const TestComponent: FunctionComponent = () => {
      const injector = useModule();
      const service = injector.getSync(Service)

      return (
        <div>
          {service.prop}!
        </div>
      );
    }

    // override console.error native function to not see error in console
    const nativeConsoleError = console.error;
    console.error = () => {};
    expect(() => {
      render(
        <Module>
        <TestComponent />
      </Module>
      );
    }).toThrow();
    console.error = nativeConsoleError;
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

    const ChildComponent: FunctionComponent<{ text: string }> = ({ text }) => {
      let dependency: ProviderType
      if (text === '') {
        dependency = Service
      } else if (text === 'test') {
        dependency = { provide: Service, useClass: Service }
      } else {
        dependency = Service
      }

      const injector = useModule([dependency]);
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
    expect((injector1!.status & 8) > 0).toEqual(true);
    expect((injector2!.status & 8) > 0).toEqual(true);
    expect((injector3!.status & 8) > 0).toEqual(false);
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

    @ADIModule({
      imports: [Promise.resolve(ChildModule)],
      providers: [Service],
    })
    class RootModule {}

    const TestComponent: FunctionComponent = () => {
      const injector = useModule(RootModule, { suspense: true })
      const service = injector.getSync(Service);
      const deepService = injector.getSync(DeepService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }

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

    const moduleToken = ModuleToken.create({
      imports: [Promise.resolve(ChildModule)],
      providers: [Service],
    })

    const TestComponent: FunctionComponent = () => {
      const injector = useModule(moduleToken, { suspense: true })
      const service = injector.getSync(Service);
      const deepService = injector.getSync(DeepService);

      return (
        <div>
          <span>{service.prop}!</span>
          <span>{deepService.prop}!</span>
        </div>
      );
    }


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
      const injector = useModule([Service], { cache: 'some-cache' });
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

    const TestComponent: FunctionComponent = () => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <Module>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {renderModule && (
            <ChildComponent />
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
    expect((injector1!.status & 8) > 0).toEqual(false);
    expect((injector2!.status & 8) > 0).toEqual(false);
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
      const injector = useModule([Service], { cache: 'some-cache' });
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

    const TestComponent: FunctionComponent = () => {
      const [renderModule, setRenderModule] = useState(false);

      return (
        <Module>
          <button onClick={() => setRenderModule(previous => !previous)}>Change state</button>
          {renderModule && (
            <Module>
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
    expect(injector1 === injector2).toEqual(false);
    expect(count).toEqual(2);

    // wait for destroying injectors
    await wait(5)

    // check if injector is not destroyed
    expect((injector1!.status & 8) > 0).toEqual(true);
    expect((injector2!.status & 8) > 0).toEqual(false);
  });
});
