import { ProviderToken, createWrapper, Wrapper } from '@adi/core';
import { thenable } from '@adi/core/lib/utils';

interface FallbackProvider {
  token: ProviderToken;
  useWrapper?: Wrapper;
}

export const Fallback = createWrapper((options: ProviderToken | FallbackProvider) => {
  let token: ProviderToken = options as ProviderToken
  let useWrapper: Wrapper = undefined;
  if ((options as FallbackProvider).token) {
    token = (options as FallbackProvider).token;
    useWrapper = (options as FallbackProvider).useWrapper;
  }

  return (session, next) => {
    const forkedSession = session.fork();
    return thenable(
      () => next(session),
      val => val,
      err => {
        if ((err as any).isNilInjectorError) {
          const newSession = forkedSession.fork();
          newSession.setToken(token);
          newSession.record = undefined;
          newSession.definition = undefined;
          newSession.instance = undefined;
          return session.injector.get(token, useWrapper, newSession);
        }
        throw err;
      }
    );
  }
}, { name: 'Fallback' });
