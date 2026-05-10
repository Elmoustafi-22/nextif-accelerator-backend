import { Request, Response } from "express";
import Recording from "./recording.model";
import Ambassador from "../ambassador/ambassador.model";
import Admin from "../admin/admin.model";
import { NotificationService } from "../notification/notification.service";
import { EmailService } from "../../utils/email.service";
import { env } from "../../config/env";

export const getRecordings = async (req: Request, res: Response) => {
  try {
    const recordings = await Recording.find().sort({ createdAt: -1 });
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recordings", error });
  }
};

export const createRecording = async (req: Request, res: Response) => {
  try {
    const { title, description, links } = req.body;
    const recording = await Recording.create({ title, description, links });

    // --- Notification Logic ---
    
    // 1. Fetch all mentees (Ambassadors) who are not suspended
    const fellows = await Ambassador.find({ accountStatus: { $ne: "SUSPENDED" } });
    const fellowIds = fellows.map((f) => f._id);

    // 2. Fetch all admins who are active or preloaded
    const admins = await Admin.find({ accountStatus: { $in: ["ACTIVE", "PRELOADED"] } });
    const adminIds = admins.map((a) => a._id);

    // 3. System Notifications
    // Broadcast to Fellows
    await NotificationService.broadcast(
      fellowIds,
      "AMBASSADOR",
      "ANNOUNCEMENT",
      `New Recording Added: ${title}`,
      `A new recording titled "${title}" is now available.`,
      "/recordings",
      recording._id
    );

    // Broadcast to Admins
    await NotificationService.broadcast(
      adminIds,
      "ADMIN",
      "ANNOUNCEMENT",
      `New Recording Added: ${title}`,
      `A new recording titled "${title}" was added to the portal.`,
      "/recordings",
      recording._id
    );

    // 4. Email Notifications (Fire and forget)
    
    // Notify Fellows
    fellows.forEach((fellow) => {
      const dashboardUrl = env.FRONTEND_URL;
      if (fellow.accountStatus === "ACTIVE") {
        EmailService.sendRecordingAvailableActiveEmail(
          fellow.email,
          fellow.firstName,
          title,
          `${dashboardUrl}/recordings`
        ).catch((err) => console.error(`Failed to send recording email to fellow ${fellow.email}:`, err));
      } else {
        EmailService.sendRecordingAvailablePreloadedEmail(
          fellow.email,
          fellow.firstName,
          fellow.lastName,
          title,
          `${dashboardUrl}/recordings`
        ).catch((err) => console.error(`Failed to send recording preloaded email to fellow ${fellow.email}:`, err));
      }
    });

    // Notify Admins
    admins.forEach((admin) => {
      const adminUrl = env.ADMIN_FRONTEND_URL;
      if (admin.accountStatus === "ACTIVE") {
        EmailService.sendRecordingAvailableActiveEmail(
          admin.email,
          admin.firstName,
          title,
          `${adminUrl}/recordings`
        ).catch((err) => console.error(`Failed to send recording email to admin ${admin.email}:`, err));
      } else {
        EmailService.sendRecordingAvailablePreloadedEmail(
          admin.email,
          admin.firstName,
          admin.lastName,
          title,
          `${adminUrl}/recordings`
        ).catch((err) => console.error(`Failed to send recording preloaded email to admin ${admin.email}:`, err));
      }
    });

    res.status(201).json(recording);
  } catch (error) {
    console.error("Error in createRecording:", error);
    res.status(500).json({ message: "Error creating recording", error });
  }
};

export const deleteRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Recording.findByIdAndDelete(id);
    res.json({ message: "Recording deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recording", error });
  }
};

export const updateRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, links } = req.body;

    const recording = await Recording.findByIdAndUpdate(
      id,
      { title, description, links },
      { new: true }
    );

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    res.json(recording);
  } catch (error) {
    res.status(500).json({ message: "Error updating recording", error });
  }
};
