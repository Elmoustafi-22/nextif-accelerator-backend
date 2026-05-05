import { Request, Response, NextFunction } from "express";

export const role = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions"
            });
        }
        next();
    }
}
