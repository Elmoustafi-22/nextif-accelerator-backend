import bcrypt from "bcryptjs";
import { env } from "../config/env";

/**
 * Hashes a plain text password using the salt rounds defined in the config
 * Used durng the "Forced Password Reset"
 */

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, env.SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password from the database.
 * Used for standard Admin and Ambassador logins[cite: 7, 12].
 */

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}