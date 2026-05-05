import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  markAttendance,
  markBulkAttendance,
  getEventAttendance,
  getMyAttendance,
} from "./event.controller";

const eventRouter = Router();

// Protect all routes
eventRouter.use(protect);

// Public (Authenticated) Routes
eventRouter.get("/", getEvents);
eventRouter.get("/my-attendance", getMyAttendance); // Specific to logged-in ambassador
eventRouter.get("/:id", getEventById);

// Admin Only Routes
eventRouter.post("/", role(["ADMIN"]), createEvent);
eventRouter.patch("/:id", role(["ADMIN"]), updateEvent);
eventRouter.delete("/:id", role(["ADMIN"]), deleteEvent);

// Attendance Management (Admin)
eventRouter.get("/:eventId/attendance", role(["ADMIN"]), getEventAttendance);
eventRouter.post("/:eventId/attendance", role(["ADMIN"]), markAttendance);
eventRouter.post(
  "/:eventId/attendance/bulk",
  role(["ADMIN"]),
  markBulkAttendance
);

export default eventRouter;
