import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth";
import { convertHeaders } from "../util";

/**
 * Middleware to handle authentication for incoming requests.
 * 
 * This middleware checks for the presence of an `Authorization` header in the request.
 * If the header is missing, it responds with a 401 Unauthorized status.
 * 
 * If the `Authorization` header is present, it attempts to validate the session
 * by making a call to the authentication API. If the session is invalid or not found,
 * it responds with a 403 Forbidden status.
 * 
 * Upon successful validation, the middleware attaches the `user` and `session` objects
 * to the request object for downstream handlers to use.
 * 
 * @param req - The incoming HTTP request object.
 * @param res - The HTTP response object.
 * @param next - The next middleware function in the request-response cycle.
 * 
 * @throws {Error} If an unexpected error occurs during session validation.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(401).json({ message: 'Unauthorized action' });
        return;
    }

    const result = await auth.api.getSession({ headers: convertHeaders(req.headers) });
    if (!result) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    const { session, user } = result;
    (req as unknown as Record<string, any>).user = user;
    (req as unknown as Record<string, any>).session = session;

    next();
}