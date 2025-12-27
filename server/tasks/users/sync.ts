import { DrizzleQueryError, eq } from "drizzle-orm";

const errorCodes = {
  tableNotFound: 'ER_NO_SUCH_TABLE'
} as const;

export default defineTask({
  meta: {
    name: 'users:sync',
    description: 'Sync users from LDAP to the local database'
  },
  run: async () => {
    try {
      Logger.verbose('Syncing users from LDAP to the local database...');

      const db = provideDb();
      const result = await db.select()
        .from(notifications)
        .where(
          eq(notifications.processed, false)
        ).orderBy(notifications.changedAt);

      if (result.length == 0) {
        return { result: 'No user changes to process.' };
      }
      for (const row of result) {
        if (row.operation === 'insert') {
          Logger.info(`Processing insert for user ID: ${row.userId}`);
          const user = await findKnowageUser(row.userId);
          if (!user) {
            Logger.warn(`User with username ${row.userId} not found in Knowage. Skipping.`);
            await db.transaction(tx => {
              return tx.update(notifications).set({ processed: true }).where(eq(notifications.id, row.id));
            });
            continue;
          }
          const result = await addUserToLdap({
            firstName: user.fullName ?? undefined,
            role: user.isSuperAdmin ? 'admin' : 'user',
            email: getAttribute('EMAIL', user) ?? undefined,
            username: row.userId,
            lastName: user.fullName?.split(' ').slice(1).join(' ') || undefined,
          });
          if (!result.success) {
            Logger.error(`Failed to add user ${row.userId} to LDAP`);
          } else {
            await db.transaction(tx => {
              return tx.update(notifications).set({ processed: true }).where(eq(notifications.id, row.id));
            });
          }
        } else if (row.operation === 'delete') {
          Logger.info(`Processing delete for user ID: ${row.userId}`);
          const user = await findLdapUser(row.userId);
          if (!user) {
            Logger.warn(`User with username ${row.userId} not found on LDAP. Skipping`);
            await db.transaction(tx => {
              return tx.update(notifications).set({ processed: true }).where(eq(notifications.id, row.id));
            });
            continue;
          }
          await deleteLdapUser(row.userId);
          await db.transaction(tx => {
            return tx.update(notifications).set({ processed: true }).where(eq(notifications.id, row.id));
          });
        }
      }
      return { result: '' }
    } catch (error) {
      if (error instanceof DrizzleQueryError) {
        if ('code' in error!.cause! && error!.cause!.code === errorCodes.tableNotFound) {
          runTask('db:migrate');
          return { result: 'Database migration triggered due to missing table.' }
        }
      }
      Logger.error('Error syncing users from LDAP to the local database', 'syncUser', error);
      throw error;
    }
  }
})