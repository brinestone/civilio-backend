import { H3Error, H3Event } from "h3";
import _ from 'lodash';
import ms from 'ms';
import z, { prettifyError } from "zod";

const requestSchema = z.object({
  username: z.string(),
  password: z.string()
});

export default defineEventHandler(async (event: H3Event) => {
  Logger.debug('Handling sign in request, validating input...');
  const { success, data: loginParams, error } = await readValidatedBody(event, requestSchema.safeParse);

  if (!success) {
    Logger.warn('Validation failed, aborting.');
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: prettifyError(error) })
  }

  try {
    const result = await signInUser(loginParams.username, loginParams.password);
    if (!result) {
      setResponseStatus(event, 401, 'Unauthorized');
      return { message: 'Invalid credentials', code: 401 };
    }
    const [dn, userInfo] = result;
    const { sessionName, sessionLifetime } = useRuntimeConfig(event);
    const sessionManager = await getSessionManager();
    const principal: Principal = {
      dn,
      isAdmin: userInfo.role.includes('admin'),
      name: userInfo.fullName,
      username: userInfo.username,
      role: userInfo.role
    };

    await sessionManager.update({
      principal
    });
    const clone = { ...principal };
    _.unset(clone, 'dn');
    setCookie(event, sessionName, JSON.stringify(clone), {
      maxAge: ms(sessionLifetime as ms.StringValue),
      httpOnly: false,
      secure: !import.meta.dev,
      sameSite: 'lax',
    });

    return { ...userInfo, isAdmin: userInfo.role.includes('admin'), };
  } catch (e) {
    if (e instanceof H3Error) throw e;
    Logger.error(e);
    throw createError('An unknown error occured');
  }

})