export default defineNitroPlugin(app => {
  Logger.info('Initializing LDAP Client');
  initLdapClient();
})