import { count, eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./db/schema";
import { auth } from "./auth";

/**
 * Checks if there is at least one user with the role of 'admin' in the database.
 *
 * This function queries the database to count the number of users with the 'admin' role
 * and returns a boolean indicating whether any such users exist.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if there is at least one admin user,
 *                             or `false` otherwise.
 *
 * @throws {Error} If the database query fails or encounters an unexpected issue.
 */
export async function checkAdmin(): Promise<boolean> {
    const [{ total }] = await db.select({ total: count() }).from(user).where(eq(user.role, 'admin'));
    return total > 0;
}

/**
 * Sets up an admin user by creating a new user with the provided name, email, and password.
 *
 * @param name - The name of the admin user to be created.
 * @param email - The email address of the admin user.
 * @param password - The password for the admin user.
 * @returns A promise that resolves when the admin user is successfully created.
 */
export async function setupAdmin(name: string, email: string, password: string) {
    await auth.api.createUser({
        body: {
            email, password, name
        }
    });
}