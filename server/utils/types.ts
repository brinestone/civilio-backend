import { Entry } from "ldapts";
import z from "zod";

export const CreateUserRequestSchema = z.object({
  names: z.string().trim(),
  email: z.email(),
  role: z.enum(['maintainer', 'admin', 'user']),
  username: z.string(),
  password: z.string()
}).transform((data) => {
  const parts = data.names.split(/\s+/);
  return {
    ...data,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
});

export const UpdateUserRequestSchema = z.object({
  names: z.coerce.string(),
  email: z.coerce.string(),
  role: z.coerce.string(),
  username: z.coerce.string(),
  password: z.coerce.string(),
}).partial();
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export type SyncUser = {
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role: 'admin' | 'user' | 'maintainer';
}

export type Principal = {
  dn: string;
  name?: string;
  role: string[];
  username: string;
  isAdmin: boolean
};

export type SessionInfo = {
  principal?: Principal;
}

export type UserInfo = {
  fullName: string
  email: string
  role: string[]
  isAdmin: boolean
  username: string
}

export function ldapEntryToUser(userEntry: Entry) {
  const role = (Array.isArray(userEntry['memberOf']) ? userEntry['memberOf'] : [userEntry['memberOf']])
    .filter(v => !!v)
    .map((s) => s.toString().split(',', 2)[0].split('=')[1]);
  return {
    fullName: userEntry['sn'],
    email: userEntry['mail'],
    username: userEntry['uid'],
    role,
    isAdmin: role.includes('admin')
  } as UserInfo;
}