import { render, screen } from '@testing-library/react';
import { Component } from "react";

import { Injectable, Module as ADIModule } from "@adi/core";

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

  test('should work with additional module metadata - with Function Component', async function() {
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
    }, [Service, DeepService]);

    render(
      <InjectedComponent customProp="custom prop" />
    );

    expect(screen.getByText('Function Component works with custom prop!')).toBeDefined();
  });

  test('should work with additional module metadata - with Class Component', async function() {
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
    }, [Service, DeepService]);

    render(
      <InjectedComponent customProp="custom prop" />
    );

    expect(screen.getByText('Class Component works with custom prop!')).toBeDefined();
  });

  test.skip('should work with additional module metadata - with imports', async function() {
    @Injectable()
    class ChildService {
      prop: string = "Class Component works";
    }

    @ADIModule({
      providers: [ChildService],
      exports: [ChildService],
    })
    class ChildModule {}

    @Injectable()
    class Service {
      constructor(
        readonly deepService: ChildService,
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
    }, {
      imports: [ChildModule],
      providers: [Service],
    });

    render(
      <InjectedComponent customProp="custom prop" />
    );

    expect(screen.getByText('Class Component works with custom prop!')).toBeDefined();
  });
});