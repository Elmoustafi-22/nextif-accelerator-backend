import { Request, Response } from "express";
import Recording from "./recording.model";

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
    res.status(201).json(recording);
  } catch (error) {
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
