import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import Admin from "../modules/admin/admin.model";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({ message: "Unauthorized"})
    }

    try {
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        })
    }
}

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin = await Admin.findById(req.user?.id);
        if (!admin) {
            return res.status(403).json({ message: "Forbidden: Admin profile not found" });
        }
        const titleLower = (admin.title || "").toLowerCase().trim();
        const isSuper = titleLower === "tech lead" || titleLower === "ceo" || titleLower === "chief executive officer";
        if (!isSuper) {
            return res.status(403).json({ message: "Forbidden: Super Admin privileges required" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error during privilege verification" });
    }
}