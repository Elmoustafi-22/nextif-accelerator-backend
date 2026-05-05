import { Request, Response } from "express";
import Event from "./event.model";
import Attendance from "./attendance.model";
import Ambassador from "../ambassador/ambassador.model";
import { Types } from "mongoose";

// --- Event Management (Admin) ---

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, type } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      location,
      type,
      createdBy: req.user!.id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error creating event", error });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findByIdAndUpdate(id, updates, { new: true });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error updating event", error });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Also delete associated attendance records
    await Attendance.deleteMany({ event: new Types.ObjectId(id) });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error });
  }
};

// --- Helper to get events with attendance status for a user ---

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const events = await Event.find(query).sort({ date: -1 });

    // If the user is an ambassador, we could enhance this to show their specific attendance status if needed.
    // However, usually we might want a separate endpoint or just return the list.
    // For now, let's just return the events.

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event", error });
  }
};

// --- Attendance Management (Admin) ---

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { ambassadorId, status } = req.body; // status: "PRESENT", "ABSENT", etc.

    const attendance = await Attendance.findOneAndUpdate(
      {
        event: new Types.ObjectId(eventId),
        ambassador: new Types.ObjectId(ambassadorId),
      },
      {
        status,
        markedBy: new Types.ObjectId(req.user!.id),
        markedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error });
  }
};

export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { items } = req.body; // Array of { ambassadorId, status }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items must be an array" });
    }

    const operations = items.map((item: any) => ({
      updateOne: {
        filter: {
          event: new Types.ObjectId(eventId),
          ambassador: new Types.ObjectId(item.ambassadorId),
        },
        update: {
          $set: {
            status: item.status,
            markedBy: new Types.ObjectId(req.user!.id),
            markedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    res.json({ message: "Bulk attendance updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error marking bulk attendance", error });
  }
};

export const getEventAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get all ambassadors first
    const ambassadors = await Ambassador.find({}).sort({
      firstName: 1,
      lastName: 1,
    });

    // Get all attendance records for this event
    const attendanceRecords = await Attendance.find({
      event: new Types.ObjectId(eventId),
    });

    // Create a map for quick access
    const attendanceMap = new Map();
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.ambassador.toString(), record);
    });

    // Merge data
    const result = ambassadors.map((ambassador) => ({
      _id: ambassador._id,
      firstName: ambassador.firstName,
      lastName: ambassador.lastName,
      email: ambassador.email,
      attendanceStatus:
        attendanceMap.get(ambassador._id.toString())?.status || "NOT_MARKED",
      attendanceRecord: attendanceMap.get(ambassador._id.toString()) || null,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event attendance", error });
  }
};

// --- Ambassador Views ---

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.find({ ambassador: req.user!.id })
      .populate("event")
      .sort({ "event.date": -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your attendance", error });
  }
};
