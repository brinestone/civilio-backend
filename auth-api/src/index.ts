import { Context, Elysia } from "elysia";
import { auth } from "./lib/auth";
import swagger from "@elysiajs/swagger";
import projectInfo from '../package.json';
import { elylog } from "@eajr/elylog";
import { etag } from "@bogeychan/elysia-etag";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ['POST', 'GET'];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.error(405);
  }
};

const betterAuthPlugin = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ error, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return error(401);

        return { user: session.user, session: session.session };
      }
    }
  });

const app = new Elysia({ prefix: 'api' })
  .use(etag())
  .use(swagger({
    version: projectInfo.version,
    autoDarkMode: true,
  }))
  .use(betterAuthPlugin)
  .get('/hasura/me', ({ user }) => {
    return {
      'X-Hasura-Role': user.role,
      'X-Hasura-User-Id': user.id,
      'X-Hasura-Allowed-Roles': ['user', 'admin'],
    };
  }, { auth: true })
  // .use(elylog())
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
