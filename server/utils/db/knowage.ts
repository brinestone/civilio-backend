import { boolean, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createDecipheriv, createHmac } from 'node:crypto';

export type KnowageUser = {
  attributes: {
    name: string;
    value: string | null;
  }[];
  id: number;
  userId: string | null;
  fullName: string | null;
  organization: string | null;
  isSuperAdmin: boolean;
};

export const KNOWAGE_CONFIG = {
  TENANT: 'DEFAULT_TENANT',
  VERSION: '9.1.0-S',
  CREATED_BY: 'server_sync',
  ATTRIBUTES: {
    NAME: 1,
    EMAIL: 5,
    SURNAME: 2
  }
} as const;

export function getAttribute(key: keyof typeof KNOWAGE_CONFIG.ATTRIBUTES, user: KnowageUser) {
  return user.attributes.find(attr => attr.name == String(KNOWAGE_CONFIG.ATTRIBUTES[key]))?.value || null;
}

// From: select sbiuser0_.ID ... from SBI_USER
export const sbiUser = mysqlTable('SBI_USER', {
  id: int('ID').primaryKey(), // The internal integer Knowage uses
  userId: varchar('USER_ID', { length: 100 }), // The login string (e.g. 'mdoe')
  fullName: varchar('FULL_NAME', { length: 255 }),
  password: varchar('PASSWORD', { length: 150 }),
  isSuperadmin: boolean('IS_SUPERADMIN').default(false),
  organization: varchar('ORGANIZATION', { length: 20 }),
  recordedBy: varchar('USER_IN', { length: 100 })
});

export const sbiExtRoles = mysqlTable('SBI_EXT_ROLES', {
  id: int('EXT_ROLE_ID').notNull(),
  name: varchar('NAME', { length: 100 }).notNull(),
  organization: varchar('ORGANIZATION', { length: 20 }),
});

// 2. The Junction for Roles
export const sbiExtUserRoles = mysqlTable('SBI_EXT_USER_ROLES', {
  id: int('ID').notNull(), // Links to sbiUser.id
  extRoleId: int('EXT_ROLE_ID').notNull(),
  userIn: varchar('USER_IN', { length: 100 }),
  organization: varchar('ORGANIZATION', { length: 20 }),
});

// 3. The Attributes (Crucial for fixing the NullPointer)
export const sbiUserAttributes = mysqlTable('SBI_USER_ATTRIBUTES', {
  id: int('ID').notNull(), // Links to sbiUser.id
  attributeId: int('ATTRIBUTE_ID').notNull(),
  attributeValue: varchar('ATTRIBUTE_VALUE', { length: 255 }),
  organization: varchar('ORGANIZATION', { length: 20 }),
  userIn: varchar('USER_IN', { length: 100 }).notNull()
});

export const sbiAttribute = mysqlTable('SBI_ATTRIBUTE', {
  name: varchar('ATTRIBUTE_NAME', { length: 255 }).notNull(),
  description: varchar('DESCRIPTION', { length: 500 }).notNull(),
  id: int('ATTRIBUTE_ID').notNull().primaryKey(),
})


export class KnowagePasswordEncryptor {
  private static readonly ALGORITHM = 'aes-128-ecb';
  private static readonly PREFIX = 'v2#SHA#';

  /**
   * Encodes a password exactly like Knowage Password.java
   * @param password Plaintext password
   * @param secret The 16-character secret key from Knowage config
   */
  static encode(password: string, secret: string): string {
    const cipher = createHmac('sha1', secret);
    cipher.update(password);
    return this.PREFIX + cipher.digest('base64');
  }

  static decode(encrypted: string, secret: string): string {
    const key = Buffer.alloc(16, 0);
    key.write(secret.substring(0, 16), 'utf8');

    const decipher = createDecipheriv(this.ALGORITHM, key, null);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}