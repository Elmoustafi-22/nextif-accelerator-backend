import { Request, Response } from "express";
import Notification from "./notification.model";

export const getMyNotifications = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const notifications = await Notification.find({
        recipientId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(notifications);
};

export const markAsRead = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientId: req.user.id },
        { read: true },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
};

export const markAllAsRead = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
        { recipientId: req.user.id, read: false },
        { read: true }
    );

    res.json({ message: "All notifications marked as read" });
};

/**
 * ADMIN: Announcements
 */
import { NotificationService } from "./notification.service";
import Ambassador from "../ambassador/ambassador.model";

export const createAnnouncement = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
    }

    try {
        // Fetch all active ambassadors
        const ambassadors = await Ambassador.find({ accountStatus: "ACTIVE" }, "_id");
        const ambassadorIds = ambassadors.map(a => a._id);

        if (ambassadorIds.length === 0) {
            return res.status(400).json({ message: "No active ambassadors to notify" });
        }

        // Broadcast announcement
        await NotificationService.broadcast(
            ambassadorIds,
            "AMBASSADOR",
            "ANNOUNCEMENT",
            title,
            body
        );

        res.status(201).json({ 
            message: "Announcement broadcasted successfully",
            recipientCount: ambassadorIds.length
        });
    } catch (error) {
        res.status(500).json({ message: "Error broadcasting announcement", error });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // For admin, we want to see unique announcements (those sent as ANNOUNCEMENT)
    // Since broadcast creates individual notifications, we'll group them by title/body/createdAt or just find distinct ones if possible.
    // However, a better way for admin history would be a separate Announcement model.
    // Given the current structure, we'll fetch latest notifications of type ANNOUNCEMENT and group by title/createdAt.
    
    // Simplification for now: Fetch all ANNOUNCEMENT notifications and filter unique combinations of Title/CreatedAt in JS or just return raw.
    // Actually, let's just return all notifications of type ANNOUNCEMENT with recipientRole AMBASSADOR, sorted by date.
    const announcements = await Notification.find({ 
        type: "ANNOUNCEMENT",
        recipientRole: "AMBASSADOR"
    }).sort({ createdAt: -1 }).limit(100);

    res.json(announcements);
};
