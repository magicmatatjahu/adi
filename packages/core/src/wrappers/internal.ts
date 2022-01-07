import { Session } from "../injector";
import { InjectionKind, SessionStatus } from "../enums";
import { ProxyRecord, ProxyInstance, ProxyPlaceholder } from "../scope/resolution";
import { Token } from "../types";
import { thenable, DeepProxy } from "../utils";
import { createWrapper } from "../utils/wrappers";

function coreHook<T>(value: T, session: Session): any {
  const instance = session.instance;

  // async resolution
  if (instance && instance.doneResolve) {
    instance.doneResolve(value);
  }

  // collect instances to destroy
  if (
    session.metadata?.kind & InjectionKind.FUNCTION &&
    session.status & SessionStatus.SIDE_EFFECTS &&
    session.parent 
  ) {
    const toDestroy = session.parent.meta.toDestroy = session.parent.meta.toDestroy || [];
    toDestroy.push(session.instance);
  }

  // without proxies
  if (
    session.parent ||
    session.definition?.meta.proxies === undefined
  ) {
    return value;
  }

  // with proxies
  const proxies = session.definition.meta.proxies as Array<ProxyRecord>;
  const instances: ProxyInstance[] = [];
  session.shared.proxies = [];
  while (proxies.length !== instances.length) {
    for (let i = instances.length, l = proxies.length; i < l; i++) {
      const proxy = proxies[i];
      instances.push({
        id: proxy.id,
        def: proxy.def,
        value: proxy.factory(session.shared),
      });
    }
  }
  if (session.status & SessionStatus.ASYNC) {
    return thenable(
      () => Promise.all(instances.map(async instance => {
        return { ...instance, value: await value };
      })),
      values => createProxy(value, values as any)
    );
  }
  return createProxy(value, instances);
}

function createProxy(instanceValue: any, services: ProxyInstance[]) {
  return new DeepProxy(instanceValue, ({ value, DEFAULT, PROXY }) => {
    if (value instanceof ProxyPlaceholder) {
      const service = services.find(s => s.id === value.id && s.def === value.def).value;
      return createProxy(service, services);
    }
    if (typeof value === 'object' && value !== null) {
      return PROXY;
    }
    return DEFAULT;
  });
}

export const CoreHook = createWrapper(() => {
  return (session, next) => {
    return thenable(
      () => next(session),
      value => coreHook(value, session),
    );
  };
});

export const AsyncDone = createWrapper(() => {
  return (session, next) => {
    return thenable(
      () => next(session),
      value => {
        const instance = session.instance;
        if (instance && instance.doneResolve) {
          instance.doneResolve(value);
        }
        return value;
      },
    );
  }
}, { name: 'AsyncDone' })();

export const UseExisting = createWrapper((token: Token) => {
  return (session) => {
    session.record = undefined;
    session.definition = undefined;
    session.setToken(token);
    return session.injector.get(token, undefined, session);
  }
}, { name: 'UseExisting' });

export const Internal = createWrapper((inject: 'session' | 'record' | 'definition' | 'instance', skipResolution: boolean = false) => {
  switch (inject) {
    case 'session': {
      return (session, next) => {
        if (skipResolution) return session;
        return thenable(
          () => next(session),
          value => [value, session],
        );
      }
    };
    case 'instance': {
      return (session, next) => {
        if (session.instance) return session.instance;
        return thenable(
          () => next(session),
          value => [value, session.instance],
        );
      }
    };
    case 'definition': {
      return (session, next) => {
        if (session.definition) return session.definition;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(session),
          value => [value, session.definition],
        );
      }
    };
    case 'record': {
      return (session, next) => {
        if (session.record) return session.record;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(session),
          value => [value, session.record],
        );
      }
    };
  }
}, { name: 'Internal' });

// export const ProxyInstance = createWrapper(() => {
//   return (session, next) => {
//     return thenable(
//       () => next(session),
//       instanceValue => {
//         if (
//           session.parent ||
//           session.definition?.meta.proxyInstances === undefined
//         ) {
//           return instanceValue;
//         }

//         const proxies = session.definition.meta.proxyInstances as Array<RequestShape>;
//         const services = [];
//         for (let i = 0, l = proxies.length; i < l; i++) {
//           const proxy = proxies[i];
//           services.push({
//             name: proxy.name,
//             def: proxy.def,
//             value: proxy.factory(),
//           });
//         }
//         while (proxies.length !== services.length) {
//           for (let i = services.length, l = proxies.length; i < l; i++) {
//             const proxy = proxies[i];
//             services.push({
//               name: proxy.name,
//               def: proxy.def,
//               value: proxy.factory(),
//             });
//           }
//         }
//         return createProxy(instanceValue, services);
//       }
//     );
//   }
// }, { name: 'ProxyInstance' })();
