import { render, screen } from '@testing-library/react';

import { Injectable, Module as ADIModule } from "@adi/core";

import { Module, useInject } from "../../src";

describe('Module component', function() {
  test('should work', async function() {
    @Injectable()
    class Service {
      prop: string = "Module works";
    }

    const TestComponent: React.FunctionComponent = () => {
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

    const TestComponent: React.FunctionComponent = () => {
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

    const TestComponent: React.FunctionComponent = () => {
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

    const TestComponent: React.FunctionComponent = () => {
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
                module: RootModule,
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
});
