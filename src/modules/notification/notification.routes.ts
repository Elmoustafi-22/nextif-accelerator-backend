import { 
    getMyNotifications, 
    markAsRead, 
    markAllAsRead,
    createAnnouncement,
    getAnnouncements
} from "./notification.controller";
import { protect } from "../../middlewares/auth.middleware";
import { Router } from "express"
import { role } from "../../middlewares/roles.middleware";

const notificationRouter = Router();

// Protect all routes
notificationRouter.use(protect);

// Get my notifications
notificationRouter.get("/", getMyNotifications);

// Mark as read
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.patch("/mark-all-read", markAllAsRead);

// ADMIN: Announcements
notificationRouter.post("/announcement", role(["ADMIN"]), createAnnouncement);
notificationRouter.get("/admin/history", role(["ADMIN"]), getAnnouncements);

export default notificationRouter;
