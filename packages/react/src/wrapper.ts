import { ANNOTATIONS, createWrapper, Type, WrapperDef } from "@adi/core";

import { COMPONENT_TOKEN } from "./constants";

function wrapper<T>(component: Type<T>): WrapperDef {
  return (injector, session, next) => {
    session.setToken(COMPONENT_TOKEN);
    session.addLabel(ANNOTATIONS.NAMED, component);
    return next(injector, session);
  };
}

export const UseComponent = createWrapper<Type, true>(wrapper)
