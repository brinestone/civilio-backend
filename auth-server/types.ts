import type { Session, User } from "better-auth";
import type { Request } from "express";

export type AuthedRequest = Request & { user?: User & { role: 'admin' | 'user' }, session?: Session };
