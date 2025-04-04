import type { Response } from "express";
import type { AuthedRequest } from "../types";

/**
 * Handles the retrieval of Hasura session variables for an authenticated user.
 * 
 * This function extracts the `user` and `session` objects from the request and
 * responds with a JSON object containing Hasura-specific session variables.
 * If the `user` or `session` is missing, it responds with a 401 Unauthorized status.
 * 
 * @param req - The authenticated request object containing `user` and `session` properties.
 * @param res - The response object used to send the session variables or an error status.
 * 
 * @remarks
 * The returned session variables include:
 * - `X-Hasura-Role`: The role of the user.
 * - `X-Hasura-User-Id`: The unique identifier of the user.
 * - `X-Hasura-Allowed-Roles`: A list of roles the user is allowed to assume.
 * - `X-Hasura-Default-Role`: The default role assigned to the user.
 * - `X-Hasura-Session`: The unique identifier of the session.
 */
export async function handleGetHasuraSessionVariables(req: AuthedRequest, res: Response) {
    const { user, session } = req;

    if (!user || !session) {
        res.status(401);
        return;
    }

    res.json({
        "X-Hasura-Role": user.role,
        "X-Hasura-User-Id": user.id,
        'X-Hasura-Allowed-Roles': ['admin', 'employee', 'field-agent'],
        'X-Hasura-Default-Role': 'user',
        "X-Hasura-Session": session.id
    });
}