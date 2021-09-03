import { Injectable } from "@adi/core";
import { render, screen } from '@testing-library/react';
import { Component } from "react";

import { Module, withInjections } from "../../src";

describe('withInjections HOC', function() {
  test('should works with Function Component', async function() {
    @Injectable()
    class DeepService {
      prop: string = "Functional Component works";
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

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('Functional Component works with custom prop!' as any)).toBeDefined();
  });

  test('should works with Function Component', async function() {
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

    // any for error: Argument of type 'string' is not assignable to parameter of type 'SelectorMatcherOptions'
    expect(screen.getByText('Class Component works with custom prop!' as any)).toBeDefined();
  });
});
