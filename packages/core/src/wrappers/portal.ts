import { Injector } from "../injector";
import { InjectionArgument, InjectionItem, Provider } from "../interfaces";
import { WithInjector } from "./with-injector";
import { createWrapper, Wrapper } from "../utils/wrappers";
import { SessionStatus } from "../enums";

interface PortalOptions {
  providers?: Provider[];
  deep?: boolean;
} 

function override(injector: Injector, deep: boolean) {
  return function override(arg: InjectionArgument): InjectionItem {
    const basicWrappers = [WithInjector(injector)];
    if (arg.wrapper) {
      Array.isArray(arg.wrapper) ? basicWrappers.push(...arg.wrapper) : basicWrappers.push(arg.wrapper);
    }
    deep === true && basicWrappers.unshift(Portal({ deep: true, injector } as any));
    return { token: arg.token, wrapper: basicWrappers as Wrapper[] };
  }
}

// let ProtoInjector: any;
export const Portal = createWrapper((providersOrOptions: Provider[] | PortalOptions) => {
  let providers: Provider[], deep: boolean = false, deepInjector: Injector = undefined;
  if (Array.isArray(providersOrOptions)) {
    providers = providersOrOptions;
  } else if (typeof providersOrOptions === 'object') {
    providers =providersOrOptions.providers;
    deep = providersOrOptions.deep;
    deepInjector = (providersOrOptions as any).injector;
  }
  
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    // annotate session with side effects
    session.setSideEffect(true);
    // fork session
    const forkedSession = session.fork();
    // annotate forked session as dry run
    forkedSession.status |= SessionStatus.DRY_RUN;
    // run next to retrieve updated session
    next(forkedSession);

    // deepInjector or retrieve host injector from provider's record 
    let injector = deepInjector || forkedSession.definition.record.host;
    if (providers) {
      injector = Injector.create(providers, injector, { disableExporting: true });
    }
    session.injector = injector;
    session.options.injections = {
      override: override(injector, deep), 
    };
    return next(session);
  }
}, { name: 'Portal' });
