import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Return the first error message for cleaner user experience
        const firstError = error.issues[0];
        return res.status(400).json({
          message: firstError?.message || "Validation failed",
          errors: error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};
