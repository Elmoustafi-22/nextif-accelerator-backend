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
        referenceId?: Types.ObjectId | string
    ) {
        return await Notification.create({
            recipientId,
            recipientRole,
            type,
            title,
            body,
            referenceId: referenceId || undefined, // explicit undefined might still trigger exactOptional depending on TS version, but let's try strict object construction
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
        referenceId?: Types.ObjectId | string
    ) {
        const notifications = recipientIds.map(id => ({
            recipientId: id,
            recipientRole,
            type,
            title,
            body,
            referenceId,
            read: false
        }));

        if (notifications.length === 0) return;

        return await Notification.insertMany(notifications);
    }
}
