import { Injectable, InjectionToken, Provider, when } from "@adi/core";
import { render, screen } from '@testing-library/react';

import { COMPONENT_TOKEN, Module, useComponent, useInject } from "../../src";
import { ComponentProvider } from "../../src/interfaces";

describe('useComponent hook', function() {
  test('should works', async function() {
    const ProviderComponent: React.FunctionComponent = () => {
      return (
        <div>
          useComponent works!
        </div>
      );
    }

    const providers: Provider[] = [
      {
        provide: COMPONENT_TOKEN,
        useValue: ProviderComponent,
        when: when.named('ProviderComponent'),
      }
    ]

    const TestComponent: React.FunctionComponent = () => {
      const Component = useComponent('ProviderComponent');

      return (
        <div>
          <Component />
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useComponent works!' as any)).toBeDefined();
  });

  test('should works with injections', async function() {
    @Injectable()
    class DeepService {
      prop: string = "useComponent works!";
    }

    @Injectable()
    class Service {
      constructor(
        readonly deepService: DeepService,
      ) {}
    }

    const ProviderComponent: React.FunctionComponent = () => {
      const service = useInject(Service);

      return (
        <div>
          {service.deepService.prop}
        </div>
      );
    }

    const providers: Provider[] = [
      Service,
      DeepService,
      {
        provide: COMPONENT_TOKEN,
        useValue: ProviderComponent,
        when: when.named('ProviderComponent'),
      }
    ]

    const TestComponent: React.FunctionComponent = () => {
      const Component = useComponent('ProviderComponent');

      return (
        <div>
          <Component />
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useComponent works!' as any)).toBeDefined();
  });

  test('should works with multiple components', async function() {
    const ProviderComponent1: React.FunctionComponent = () => {
      return (
        <div>
          useComponent with ProviderComponent1 works!
        </div>
      );
    }

    const ProviderComponent2: React.FunctionComponent = () => {
      return (
        <div>
          useComponent with ProviderComponent2 works!
        </div>
      );
    }

    const providers: Provider[] = [
      {
        provide: COMPONENT_TOKEN,
        useValue: ProviderComponent1,
        when: when.named('ProviderComponent1'),
      },
      {
        provide: COMPONENT_TOKEN,
        useValue: ProviderComponent2,
        when: when.named('ProviderComponent2'),
      }
    ]

    const TestComponent: React.FunctionComponent = () => {
      const ProviderComponent_1 = useComponent('ProviderComponent1');
      const ProviderComponent_2 = useComponent('ProviderComponent2');

      return (
        <div>
          <ProviderComponent_1 />
          <ProviderComponent_2 />
        </div>
      );
    }

    render(
      <Module module={providers}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useComponent with ProviderComponent1 works!' as any)).toBeDefined();
    expect(screen.getByText('useComponent with ProviderComponent2 works!' as any)).toBeDefined();
  });

  test('should works with components defined as standalone props', async function() {
    const ProviderComponent1: React.FunctionComponent = () => {
      return (
        <div>
          useComponent with ProviderComponent1 works!
        </div>
      );
    }

    const ProviderComponent2: React.FunctionComponent = () => {
      return (
        <div>
          useComponent with ProviderComponent2 works!
        </div>
      );
    }

    const components: ComponentProvider[] = [
      {
        name: 'ProviderComponent1',
        component: ProviderComponent1,
      },
      {
        name: 'ProviderComponent2',
        component: ProviderComponent2,
      }
    ];

    const TestComponent: React.FunctionComponent = () => {
      const ProviderComponent_1 = useComponent('ProviderComponent1');
      const ProviderComponent_2 = useComponent('ProviderComponent2');

      return (
        <div>
          <ProviderComponent_1 />
          <ProviderComponent_2 />
        </div>
      );
    }

    render(
      <Module components={components}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useComponent with ProviderComponent1 works!' as any)).toBeDefined();
    expect(screen.getByText('useComponent with ProviderComponent2 works!' as any)).toBeDefined();
  });

  test('should works with InjectionToken', async function() {
    interface Props {
      prop: string;
    }

    const CommonComponent = new InjectionToken<Props>();

    const ProviderComponent: React.FunctionComponent<Props> = ({
      prop
    }) => {
      return (
        <div>
          {prop}
        </div>
      );
    }

    const components: ComponentProvider[] = [
      {
        name: CommonComponent,
        component: ProviderComponent,
      },
    ];

    const TestComponent: React.FunctionComponent = () => {
      const Component = useComponent(CommonComponent);

      return (
        <div>
          <Component prop="useComponent with InjectionToken works!" />
        </div>
      );
    }

    render(
      <Module components={components}>
        <TestComponent />
      </Module>
    )

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('useComponent with InjectionToken works!' as any)).toBeDefined();
  });
});
