import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
    id: string;
    role: "AMBASSADOR" | "ADMIN"
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as string, {expiresIn: env.JWT_EXPIRES_IN as any});
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET as string);
};
