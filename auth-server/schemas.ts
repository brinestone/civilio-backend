import { z } from "zod";

export const signInSchema = z.object({
    username: z.string(),
    password: z.string()
});

export const newUserSchema = z.object({
    username: z.string(),
    password: z.string(),
    name: z.string()
})