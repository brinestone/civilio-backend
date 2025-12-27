import { EventHandler, H3Event } from "h3";

export const requireAdmin: EventHandler = async (event: H3Event) => {
  const sessionManager = await getSessionManager();
  const data = sessionManager.data;
  const err = () => {
    setResponseStatus(event, 403, 'Forbidden');
    return {
      error: true,
      message: 'Access denied',
      code: 'ADMIN_PERMISSIONS_REQUIRED'
    }
  }

  if (!data?.principal) {
    return err();
  }

  if (!data?.principal?.isAdmin) return err();
  return;
}

export const requireAuthed: EventHandler = async (event: H3Event) => {
  const sessionManager = await getSessionManager();
  const data = sessionManager.data;
  const err = () => {
    setResponseStatus(event, 401, 'Unauthorized');
    return {
      error: true,
      message: 'Unauthorized access. Please sign in.',
      code: 'AUTH_REQUIRED'
    }
  };
  if (!data?.principal) {
    return err();
  }

  const [uidAttr] = data.principal.dn.split(',', 2);
  const [_, uid] = uidAttr.split('=');
  const exists = await ldapUserExists(uid);

  if (!exists) {
    return err();
  }
  return;
}