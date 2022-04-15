import { createHook } from "./hook";

export const Skip = createHook((value?: any) => {
  return (session) => {
    const indexOf = session.parent?.children.indexOf(session) || -1;
    if (indexOf > -1) {
      session.parent.children.splice(indexOf, 1);
    }
    return value;
  };
}, { name: 'adi:hook:skip' });
