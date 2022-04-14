import { render, screen } from '@testing-library/react';
import { Injectable, Optional } from "@adi/core";

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
      const service = useInject<Service>(Service, [Optional("injection hooks work!")]);

      return (
        <div>
          {service as any}
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
});