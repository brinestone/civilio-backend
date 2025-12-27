import { H3Event } from 'h3';
import ms from 'ms';
import { Principal } from './types';

export async function getSessionManager<SessionInfo>(event?: H3Event) {
  const { sessionSecret, sessionName, sessionLifetime } = useRuntimeConfig(event ?? useEvent());
  const session = await useSession(useEvent(), {
    password: sessionSecret,
    maxAge: ms(sessionLifetime as ms.StringValue),
    sessionHeader: sessionName
  });

  return session;
}

export async function usePrincipal(event?: H3Event) {
  const session = await getSessionManager(event);
  return session.data.principal as Principal;
}