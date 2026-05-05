import { z } from "zod";

export const ambassadorFirstLoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase()),

  lastname: z.string().min(2, "Last name is required").max(50),
});

export const ambassadorLoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase()),

  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const ambassadorResetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase")
        .regex(/[0-9]/, "Must contain at least one number")
})

export const adminLoginSchema = z.object({
    email: z
        .string()
        .email("Invalid email format")
})