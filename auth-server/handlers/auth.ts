import type { Request, Response } from "express";
import { auth } from "../auth";
import { signInSchema } from "../schemas";
import { fromZodError } from "zod-validation-error";
import { convertHeaders } from "../util";

export async function handleChangeUserRole(req: Request, res: Response) {
    const result = await auth.api.setRole({
        body: req.body
    });

    res.status(202).json(result);
}

export async function handleRemoveUser(req: Request, res: Response) {
    const result = await auth.api.deleteUser({
        body: req.body,
    });

    res.status(200).json(result);
}

/**
 * Handles the addition of a new user by processing the incoming request,
 * creating the user with the specified role, and returning the created user
 * in the response.
 *
 * @param req - The HTTP request object containing the user data in the body.
 * @param res - The HTTP response object used to send the response.
 *
 * @returns A JSON response with the created user and a 201 status code.
 *
 * @throws Will propagate any errors encountered during the user creation process.
 */
export async function handleAddUser(req: Request, res: Response) {
    const result = await auth.api.createUser({
        body: { ...req.body, role: 'user' }
    });
    res.status(201).json(result.user);
}

/**
 * Handles the sign-in process for a user.
 *
 * This function validates the incoming request body against the `signInSchema`.
 * If validation fails, it responds with a 400 status code and a descriptive error message.
 * If validation succeeds, it attempts to sign in the user using the `auth.api.signInUsername` method.
 * 
 * - If the sign-in attempt fails (e.g., invalid username or password), it responds with a 401 status code.
 * - If the sign-in attempt succeeds, it responds with the result of the authentication process.
 *
 * @param req - The HTTP request object containing the user's sign-in data in the body.
 * @param res - The HTTP response object used to send the response back to the client.
 */
export async function handleSignIn(req: Request, res: Response) {
    const { success, error, data } = signInSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({ message: fromZodError(error) });
        return;
    }
    const result = await auth.api.signInUsername({ body: data });

    if (!result) {
        res.status(401).json({ message: 'Invalid username or password' });
        return
    }
    res.json(result);
}

/**
 * Handles the sign-out process for a user.
 *
 * This function interacts with the authentication API to sign out the user
 * by forwarding the request headers after converting them to the appropriate format.
 *
 * @param req - The incoming HTTP request object containing the user's session information.
 * @returns A promise that resolves when the sign-out process is complete.
 */
export async function handleSignOut(req: Request) {
    await auth.api.signOut({ headers: convertHeaders(req.headers) });
}

