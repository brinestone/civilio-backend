import { defineNitroConfig } from "nitropack/config"

const compatibilityDate = "2025-12-23"

// https://nitro.build/config
export default defineNitroConfig({
  experimental: {
    asyncContext: true,
    envExpansion: true,
    tasks: true
  },
  scheduledTasks: {
    '*/30 * * * * *': ['users:sync']
  },
  compatibilityDate,
  srcDir: "server",
  runtimeConfig: {
    publicOrigin: 'http://localhost:3000',
    compatibilityDate,
    sessionSecret: 'AwW7BWeE8djeLVY8lOt23DtETOkDlM0xVSSbrP9u0v7Pm7gvdQp3PEOuBL5z0SlK',
    sessionName: 'civilio_session',
    passwordSecret: '7105a70cc0362634c7064c92dc92586018fa5bdbc4c8fed0c0e2981c76692bf6',
    sessionLifetime: '1d',
    logLevel: 'http',
    ldapHost: 'localhost',
    ldapPort: 7500,
    ldapTls: false,
    ldapAdminPass: 'passpass',
    ldapBaseDn: 'dc=record,dc=cm',
    ldapBaseUserDn: 'ou=PEOPLE,dc=record,dc=cm',
    ldapPasswordAlg: 'SSHA',
    ldapAuthContextDn: 'ou=BI,dc=record,dc=cm',
    ldapGroupAttr: 'cn',
    ldapUserSearchFilter: '(&(|(uid=$$username$$)(mail=$$username$$))(|(objectClass=inetOrgPerson)(objectClass=organizationalPerson)))',
    ldapUserAttributes: 'uid,cn,mail,sn,memberOf',
    ldapFullNameAttr: 'cn',
    ldapMailAttr: 'mail',
    organization: 'DEFAULT_TENANT',
    ldapIdAttr: 'uid',
    databaseUrl: `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`
  }
});
