import type { Request, Response } from "express";
import { auth } from "../auth";
import { signInSchema } from "../schemas";
import { fromZodError } from "zod-validation-error";
import { convertHeaders } from "../util";

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

export async function handleSignOut(req: Request) {
    await auth.api.signOut({ headers: convertHeaders(req.headers) });
}

