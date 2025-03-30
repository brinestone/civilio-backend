import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth";
import { convertHeaders } from "../util";
import type { AuthedRequest } from "../types";

/**
 * Middleware function to enforce Role-Based Access Control (RBAC).
 * 
 * This middleware checks if the authenticated user has the required role
 * to access a specific route. If the user's role does not match the required
 * role or is not an 'admin', the middleware responds with a 403 Forbidden status.
 * 
 * @param role - The required role to access the route.
 * @returns An Express middleware function that validates the user's role.
 * 
 * @example
 * // Apply RBAC middleware to a route
 * app.get('/admin', rbacMiddleware('admin'), (req, res) => {
 *   res.send('Welcome, admin!');
 * });
 */
export function rbacMiddleware(role: 'admin' | 'user') {
    return async (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role && req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden operation' });
            return;
        }
        next();
    }
}

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