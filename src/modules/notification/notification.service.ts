import Notification, { INotification } from "./notification.model";
import { Types } from "mongoose";

export class NotificationService {
    
    /**
     * Send a direct notification to a single user
     */
    static async send(
        recipientId: Types.ObjectId | string,
        recipientRole: "AMBASSADOR" | "ADMIN",
        type: "MESSAGE" | "ANNOUNCEMENT",
        title: string,
        body: string,
        link?: string,
        referenceId?: Types.ObjectId | string
    ) {
        return await Notification.create({
            recipientId,
            recipientRole,
            type,
            title,
            body,
            link,
            referenceId: referenceId || undefined,
            read: false
        } as any);
    }

    /**
     * Broadcast a notification to multiple users (e.g., All Ambassadors)
     */
    static async broadcast(
        recipientIds: (Types.ObjectId | string)[],
        recipientRole: "AMBASSADOR" | "ADMIN",
        type: "MESSAGE" | "ANNOUNCEMENT",
        title: string,
        body: string,
        link?: string,
        referenceId?: Types.ObjectId | string
    ) {
        const notifications = recipientIds.map(id => ({
            recipientId: id,
            recipientRole,
            type,
            title,
            body,
            link,
            referenceId,
            read: false
        }));

        if (notifications.length === 0) return;

        return await Notification.insertMany(notifications);
    }
}
