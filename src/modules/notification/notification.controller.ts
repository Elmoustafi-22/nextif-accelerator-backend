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
        { returnDocument: 'after' }
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
import Admin from "../admin/admin.model";
import { EmailService } from "../../utils/email.service";

export const createAnnouncement = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { title, body, link } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required" });
    }

    try {
        // Fetch ALL fellows (Ambassadors) and ALL Admins
        const [fellows, admins] = await Promise.all([
            Ambassador.find({}, "_id email firstName"),
            Admin.find({}, "_id email firstName")
        ]);

        const fellowIds = fellows.map(f => f._id);
        const adminIds = admins.map(a => a._id);

        if (fellowIds.length === 0 && adminIds.length === 0) {
            return res.status(400).json({ message: "No users found to notify" });
        }

        // Broadcast in-app announcement
        const broadcastPromises = [];
        if (fellowIds.length > 0) {
            broadcastPromises.push(
                NotificationService.broadcast(
                    fellowIds,
                    "AMBASSADOR",
                    "ANNOUNCEMENT",
                    title,
                    body,
                    link
                )
            );
        }
        if (adminIds.length > 0) {
            broadcastPromises.push(
                NotificationService.broadcast(
                    adminIds,
                    "ADMIN",
                    "ANNOUNCEMENT",
                    title,
                    body,
                    link
                )
            );
        }
        await Promise.all(broadcastPromises);

        // Send emails to all recipients
        const emailPromises = [
            ...fellows.map(f => 
                EmailService.sendBroadcastEmail(f.email, f.firstName, title, body, link)
                .catch(err => console.error(`Failed to send broadcast email to fellow ${f.email}:`, err))
            ),
            ...admins.map(a => 
                EmailService.sendBroadcastEmail(a.email, a.firstName, title, body, link)
                .catch(err => console.error(`Failed to send broadcast email to admin ${a.email}:`, err))
            )
        ];

        // Await all email attempts
        await Promise.all(emailPromises);

        res.status(201).json({ 
            message: "Announcement broadcasted successfully to all users",
            recipientCount: fellowIds.length + adminIds.length
        });
    } catch (error) {
        console.error("Broadcast Error:", error);
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
    // Actually, let's just return notifications of type ANNOUNCEMENT, sorted by date.
    // We filter by a specific role (e.g. AMBASSADOR) just to get unique entries for history display
    // since broadcast creates one notification per user.
    const announcements = await Notification.find({ 
        type: "ANNOUNCEMENT",
        recipientRole: "AMBASSADOR"
    }).sort({ createdAt: -1 }).limit(100);

    // If no ambassador notifications (e.g. sent only to admins), fallback to admin role
    if (announcements.length === 0) {
        const adminAnnouncements = await Notification.find({ 
            type: "ANNOUNCEMENT",
            recipientRole: "ADMIN"
        }).sort({ createdAt: -1 }).limit(100);
        return res.json(adminAnnouncements);
    }

    res.json(announcements);
};
