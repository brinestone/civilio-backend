import { and, eq, sql } from "drizzle-orm";
import { Attribute, Change, DN, NoSuchObjectError, SearchResult } from "ldapts";
import { KnowagePasswordEncryptor, KnowageUser, sbiAttribute, sbiExtRoles, sbiUserAttributes } from "./db/knowage";
import { LdapWrapper } from "./ldap";
import { SyncUser, UpdateUserRequest } from "./types";
import _ from "lodash";

let client: LdapWrapper;

export function initLdapClient() {
  client = createClient();
}

export async function deleteLdapUser(uid: string) {
  Logger.info('Deleting user', { uid });
  const { adminDn, password } = getLdapAdminCredentials();
  const { ldapBaseUserDn } = useRuntimeConfig();
  client.runAsAdmin(adminDn, password, async c => {
    const userDn = `uid=${uid},${ldapBaseUserDn}`;
    await c.del(userDn);
  });
}

export async function updateKnowageUserProfile(uid: string, req: UpdateUserRequest) {
  Logger.info('Attempting to update knowage user profile', { uid });
  const db = provideDb();
  const [knowageUser] = await db.select()
    .from(sbiUser)
    .where(
      eq(sbiUser.userId, uid)
    );

  if (!knowageUser) {
    const ldapUserEntry = await findLdapUser(uid, 'mail', 'cn', 'sn', 'memberOf');
    if (!ldapUserEntry) throw new Error('User does not exist on LDAP with id: ' + uid);
    const ldapUser = ldapEntryToUser(ldapUserEntry);
    const [firstName, lastName] = ldapUser.fullName.trim().split(' ', 3)
    await syncToKnowage({
      role: ldapUser.role[0] as SyncUser['role'],
      username: uid,
      email: req.email ?? ldapUser.email,
      firstName,
      lastName: lastName,
    })
  } else {
    await db.transaction(async tx => {
      if (req.email) {
        await tx.insert(sbiUserAttributes).values({
          id: knowageUser.id,
          attributeId: KNOWAGE_CONFIG.ATTRIBUTES.EMAIL,
          attributeValue: req.email,
          userIn: 'server'
        }).onDuplicateKeyUpdate({
          set: {
            attributeValue: req.email
          }
        })
      }

      if (req.names) {
        await tx.update(sbiUser).set({
          fullName: req.names
        }).where(eq(sbiUser.id, knowageUser.id));
        await tx.insert(sbiUserAttributes).values({
          id: knowageUser.id,
          attributeId: KNOWAGE_CONFIG.ATTRIBUTES.NAME,
          attributeValue: req.names,
          userIn: 'server'
        }).onDuplicateKeyUpdate({
          set: {
            attributeValue: req.names
          }
        })
      }

      if (req.username) {
        await tx.update(sbiUser).set({
          userId: req.username
        }).where(eq(sbiUser.userId, req.username));
      }

      if (req.role) {
        await tx.insert(sbiExtUserRoles).values({
          id: knowageUser.id,
          extRoleId: mapRoleToKnowageRole(req.role),
          userIn: 'server'
        }).onDuplicateKeyUpdate({
          set: { extRoleId: mapRoleToKnowageRole(req.role) }
        });
      }
    })
  }
}

export async function updateLdapUser(uid: string, req: UpdateUserRequest) {
  const { ldapBaseUserDn, ldapAuthContextDn, ldapPasswordAlg } = useRuntimeConfig();
  const { adminDn, password } = getLdapAdminCredentials();
  await client.runAsAdmin(adminDn, password, async c => {
    const userDn = `uid=${uid},${ldapBaseUserDn}`;
    const changes: Change[] = [];

    if (req.names) {
      changes.push(new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'sn', values: [req.names] })
      }));

      const cn = _.last(req.names.split(' '));
      if (cn) {
        changes.push(new Change({
          operation: 'replace',
          modification: new Attribute({ type: 'cn', values: [cn] })
        }));
      }
    }

    if (req.email) {
      changes.push(new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'mail', values: [req.email] })
      }))
    }

    if (req.username) {
      changes.push(new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'uid', values: [req.username] })
      }));
    }

    if (req.password) {
      changes.push(new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'userPassword', values: [`{${ldapPasswordAlg}}${req.password}`] })
      }))
    }

    if (req.role) {
      try {
        const searchResult = await c.search(ldapAuthContextDn, {
          scope: 'subordinates',
          attributes: ['cn'],
          filter: `(&(objectClass=groupOfNames)(member="${userDn}")(!(cn=admin)))`,
        });

        for (const group of searchResult.searchEntries) {
          await c.modify(group.dn, [
            new Change({
              operation: 'delete',
              modification: new Attribute({ type: 'member', values: [userDn] })
            })
          ])
        }
      } catch (e) {
        if (!(e instanceof NoSuchObjectError)) {
          throw e;
        }
      }

      const groupDn = `cn=${req.role},${ldapAuthContextDn}`;
      await c.modify(groupDn, [
        new Change({
          operation: 'add',
          modification: new Attribute({ type: 'member', values: [userDn] })
        })
      ]);
    }

    await c.modify(userDn, changes);
  })
}

export async function identifierExists(arg: string, type: 'email' | 'username', ctxOwner?: string) {
  const { adminDn, password } = getLdapAdminCredentials();
  const { ldapBaseUserDn } = useRuntimeConfig();
  return await client.runAsAdmin(adminDn, password, async c => {
    try {
      const filter = `(&(objectClass=inetOrgPerson)(${type == 'email' ? 'mail' : 'uid'}=${arg})${type == 'email' && ctxOwner ? `(!(uid=${ctxOwner}))` : ''})`;
      const result = await c.search(ldapBaseUserDn, {
        scope: 'subordinates',
        filter,
      });
      return result.searchEntries.length > 0;
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        return false;
      }
      throw e;
    }
  })
}

export async function findLdapUserByDn(dn: string) {
  const { adminDn, password } = getLdapAdminCredentials();
  return await client.runAsAdmin(adminDn, password, async c => {
    try {
      const result = await c.search(dn, {
        scope: 'base',
        attributes: ['mail', 'memberOf', 'sn', 'uid'],
        returnAttributeValues: true
      });
      return ldapEntryToUser(result.searchEntries[0]);
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        return null;
      }
      throw e;
    }
  })
}

export async function findAllLdapUsers(...exclude: string[]) {
  const { ldapBaseUserDn, } = useRuntimeConfig(useEvent());
  Logger.info('Finding all users', { scope: ldapBaseUserDn })
  const { adminDn, password } = getLdapAdminCredentials();
  return await client.runAsAdmin(adminDn, password, async c => {
    try {
      const result = await c.search(ldapBaseUserDn, {
        attributes: ['memberOf', 'mail', 'sn', 'uid'],
        filter: '(objectClass=inetOrgPerson)',
        scope: 'subordinates',
        returnAttributeValues: true
      });
      // return _.differenceWith(result.searchEntries
      //   .map(ldapEntryToUser), exclude, (u, username) => u.username === username);
      return result.searchEntries.map(ldapEntryToUser);
    } catch (e) {
      if (e instanceof NoSuchObjectError) {
        return [];
      }
      throw e;
    }
  })
}

export async function ldapUserExists(query: string | DN) {
  Logger.debug(`Checking whether user exists with ${query instanceof DN ? `DN: ${query.toString()}` : `uid=${query}`}`)
  const { ldapUserSearchFilter, ldapBaseUserDn } = useRuntimeConfig();
  const { adminDn, password } = getLdapAdminCredentials();
  return client.runAsAdmin(adminDn, password, async c => {
    try {
      let result: SearchResult;
      if (query instanceof DN) {
        result = await c.search(query, { scope: 'base' });
      } else {
        const filter = ldapUserSearchFilter.replaceAll('$$username$$', query);
        result = await c.search(ldapBaseUserDn, {
          scope: 'subordinates',
          filter,
        })
      }
      return result.searchEntries.length > 0;
    } catch (e) {
      Logger.error('Error while finding LDAP user existence', { query, error: e });
      return false;
    }
  });
}

function createClient() {
  const { ldapHost, ldapPort, ldapTls } = useRuntimeConfig();
  const url = `ldap${ldapTls ? 's' : ''}://${ldapHost}:${ldapPort}`;
  Logger.debug(`Creating LDAP wrapper on ${url}`, 'url', url);
  return new LdapWrapper(url);
}

export async function findKnowageUser(username: string) {
  const db = provideDb();
  const [user] = await db.select()
    .from(sbiUser)
    .where(eq(sbiUser.userId, username))
    .limit(1);

  if (!user) return null;

  const attributes = await db.select({
    name: sbiAttribute.name,
    value: sbiUserAttributes.attributeValue
  }).from(sbiUserAttributes)
    .innerJoin(sbiAttribute, eq(sbiUserAttributes.attributeId, sbiAttribute.id))
    .where(eq(sbiUserAttributes.id, user.id));

  return { ...user, attributes, isSuperAdmin: user.isSuperadmin } as KnowageUser;
}

export async function deleteFromKnowage(username: string) {
  const db = provideDb();
  return await db.transaction(async tx => {
    const [user] = await tx.select().from(sbiUser)
      .where(eq(sbiUser.userId, username)).limit(1);

    if (user) {
      await tx.delete(sbiUser).where(eq(sbiUser.userId, user.userId ?? ''))
    }
  })
}

export async function findLdapUser(username: string, ...attributes: string[]) {
  const { ldapAdminPass, ldapBaseDn, ldapUserSearchFilter, ldapBaseUserDn } = useRuntimeConfig();
  const adminDn = `cn=admin,${ldapBaseDn}`;

  return client.runAsAdmin(adminDn, ldapAdminPass, async client => {
    const filter = ldapUserSearchFilter.replaceAll('$$username$$', username);
    Logger.debug(`Finding LDAP user`, {
      username, attributes, filter, ldapBaseUserDn
    });
    try {
      const { searchEntries } = await client.search(ldapBaseUserDn, {
        scope: 'subordinates',
        filter,
        attributes,
        derefAliases: 'find'
      });
      return searchEntries[0];
    } catch (e) {
      if ((e as any).name == 'NoSuchObjectError') {
        return null;
      }
      throw e;
    }
  })

}

export async function syncToKnowage(user: Omit<SyncUser, 'password'>, password?: string) {
  const db = provideDb();
  const { organization, passwordSecret } = useRuntimeConfig();
  return await db.transaction(async tx => {
    let [userRecord] = await tx.select().from(sbiUser).where(
      eq(sbiUser.userId, user.username)
    ).limit(1);

    let internalId = 0;
    if (!userRecord) {
      const enc: string = KnowagePasswordEncryptor.encode(password ?? 'defaultPassword', passwordSecret);
      const nextIdRes = await tx.select({
        maxId: sql<number>`COALESCE(MAX(ID), 0) + 1`
      }).from(sbiUser);
      internalId = nextIdRes[0].maxId;

      await tx.insert(sbiUser).values({
        id: internalId,
        userId: user.username,
        fullName: `${user.firstName} ${(user.lastName || '').trim()}`.trim(),
        isSuperadmin: false,
        organization,
        recordedBy: 'server',
        password: enc
      });
    } else {
      internalId = userRecord.id;
    }

    const [roleRecord] = await tx.select()
      .from(sbiExtRoles)
      .where(and(
        eq(sbiExtRoles.name, user.role != 'maintainer' ? user.role : 'modeladmin'),
        eq(sbiExtRoles.organization, organization)
      )).limit(1);

    if (!roleRecord) throw new Error(`Role ${user.role} not found in database`);

    const [existingMapping] = await tx.select().from(sbiExtUserRoles)
      .where(and(
        eq(sbiExtUserRoles.id, internalId),
        eq(sbiExtUserRoles.extRoleId, roleRecord.id)
      ));

    if (!existingMapping) {
      await tx.insert(sbiExtUserRoles).values({
        id: internalId,
        extRoleId: roleRecord.id,
        userIn: 'server_sync', // Audit field
        organization
      });
    }

    await tx.insert(sbiUserAttributes).values({
      id: internalId,
      attributeId: KNOWAGE_CONFIG.ATTRIBUTES.EMAIL,
      userIn: 'server',
      attributeValue: user.email,
      organization
    }).onDuplicateKeyUpdate({
      set: {
        attributeValue: user.email
      }
    });
    await tx.insert(sbiUserAttributes).values({
      id: internalId,
      attributeId: KNOWAGE_CONFIG.ATTRIBUTES.NAME,
      userIn: 'server',
      attributeValue: `${user.firstName} ${user.lastName || ''}`.trim(),
      organization
    }).onDuplicateKeyUpdate({
      set: {
        attributeValue: `${user.firstName} ${user.lastName || ''}`.trim(),
      }
    });
  })
}

export async function addUserToLdap(user: SyncUser) {
  Logger.debug(`Adding user to LDAP: ${user.username}`, 'syncUser', user);
  const { ldapAdminPass, ldapBaseDn, ldapAuthContextDn: ldapGroupBaseDn, ldapGroupAttr, ldapIdAttr, ldapBaseUserDn } = useRuntimeConfig();
  const adminDn = `cn=admin,${ldapBaseDn}`;
  const userDn = `${ldapIdAttr}=${user.username},${ldapBaseUserDn}`;
  const groupDn = `${ldapGroupAttr}=${user.role},${ldapGroupBaseDn}`;

  const existingUser = await findLdapUser(user.username);

  if (!existingUser) {
    await client.runAsAdmin(adminDn, ldapAdminPass, async c => {
      await c.add(userDn, {
        objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
        cn: `${user.firstName} ${(user.lastName || '').trim()}`.trim(),
        sn: user.lastName || user.firstName || 'Unknown',
        givenName: user.firstName || 'Unknown',
        mail: user.email ?? 'N/A',
        uid: user.username,
        userPassword: `${user.password || 'defaultPassword'}`,
        memberOf: groupDn
      });

      await c.modify(groupDn, [
        new Change({
          modification: new Attribute({
            type: 'member',
            values: [userDn]
          }),
          operation: 'add',
        })
      ]);
    });
  }

  return { success: true, dn: existingUser ? existingUser.dn : userDn };
}

export async function signInUser(username: string, password: string) {
  let bound = false;
  const userEntry = await findLdapUser(username, 'memberOf', 'sn', 'mail', 'uid');
  if (!userEntry) {
    return null;
  }
  const userDn = userEntry.dn;
  const user = ldapEntryToUser(userEntry);
  try {
    await client.bind(userDn, password);
    bound = true;
    return [
      userEntry.dn,
      user
    ] as [string, typeof user];
  } catch {
    return null;
  } finally {
    if (bound) await client.unbind();
  }
}

function getLdapAdminCredentials() {
  const { ldapAdminPass, ldapBaseDn } = useRuntimeConfig(useEvent());
  const adminDn = `cn=admin,${ldapBaseDn}`;
  return { adminDn, password: ldapAdminPass };
}

function mapRoleToKnowageRole(role: string) {
  if (role == 'maintainer') return 5;
  else if (role == 'user') return 3;
  else return 4;
}