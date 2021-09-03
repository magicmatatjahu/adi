import { Injectable, Optional } from "@adi/core";
import { render, screen } from '@testing-library/react';

import { Module, useInject } from "../../src";

describe('useInject hook', function() {
  test('should works', async function() {
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

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useInject works as hook!' as any)).toBeDefined();
  });
  
  test('should works with wrapper (test with Optional wrapper)', async function() {
    @Injectable()
    class Service {}

    const TestComponent: React.FunctionComponent = () => {
      const service = useInject<Service>(Service, Optional()) || "wrapper works!";

      return (
        <div>
          {service}
        </div>
      );
    }

    render(
      <Module module={[]}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('wrapper works!' as any)).toBeDefined();
  });
});
