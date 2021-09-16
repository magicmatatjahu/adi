import { Injector, ProtoInjector } from "../injector";
import { InjectionArgument, InjectionItem, Provider, WrapperDef } from "../interfaces";
import { WithInjector } from "./with-injector";
import { createWrapper } from "../utils/wrappers";
import { SessionStatus } from "../enums";

interface PortalOptions {
  providers?: Provider[];
  deep?: boolean;
} 

function dynamicInjection(injector: Injector, deep: boolean) {
  return function dynamic(arg: InjectionArgument): InjectionItem {
    const basicWrapper = WithInjector(injector, arg.wrapper);
    return deep === true
      ? { token: arg.token, wrapper: Portal({ deep: true, injector } as any, basicWrapper) }
      : { token: arg.token, wrapper: basicWrapper };
  }
}

function wrapper(providersOrOptions: Provider[] | PortalOptions): WrapperDef {
  let protoInjector: ProtoInjector, deep: boolean = false, deepInjector: Injector = undefined;
  if (Array.isArray(providersOrOptions)) {
    protoInjector = ProtoInjector.create(providersOrOptions);
  } else if (typeof providersOrOptions === 'object') {
    protoInjector = ProtoInjector.create(providersOrOptions.providers);
    deep = providersOrOptions.deep;
    deepInjector = (providersOrOptions as any).injector;
  }
  
  return (selfInjector, session, next) => {
    // annotate session with side effects
    session.setSideEffect(true);
    // fork session
    const forkedSession = session.fork();
    // annotate forked session as dry run
    forkedSession.status |= SessionStatus.DRY_RUN;
    // run next to retrieve updated session
    next(selfInjector, forkedSession);

    // retrieve host injector from provider's record 
    const hostInjector = forkedSession.definition.record.host;

    let injector = deepInjector || hostInjector;
    if (protoInjector) {
      injector = protoInjector.fork(injector);
    }
    session.options.injections = {
      dynamic: dynamicInjection(injector, deep), 
    };
    return next(injector, session);
  }
}

export const Portal = createWrapper<Provider[] | PortalOptions, true>(wrapper);
