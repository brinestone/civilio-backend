import type { Session, User } from "better-auth";
import type { Request, Response } from "express";

type AuthedRequest = Request & { user?: User & { role: string }, session?: Session };

export async function handleGetHasuraSessionVariables(req: AuthedRequest, res: Response) {
    const { user, session } = req;

    if (!user || !session) {
        res.status(401);
        return;
    }

    res.json({
        "X-Hasura-Role": user.role,
        "X-Hasura-User-Id": user.id,
        'X-Hasura-Allowed-Roles': ['admin', 'user'],
        'X-Hasura-Default-Role': 'user',
        "X-Hasura-Session": session.id
    });
}