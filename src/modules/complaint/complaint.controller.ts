import { Request, Response } from "express";
import Complaint from "./complaint.model";

/**
 * AMBASSADOR: Submit & View
 */

export const createComplaint = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { subject, message } = req.body;

    const complaint = await Complaint.create({
        ambassadorId: req.user.id,
        subject,
        message,
        status: "SUBMITTED"
    });

    res.status(201).json(complaint);
};

export const getMyComplaints = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const complaints = await Complaint.find({ ambassadorId: req.user.id })
        .sort({ createdAt: -1 });
    
    res.json(complaints);
};

/**
 * ADMIN: Manage Complaints
 */

export const getAllComplaints = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const complaints = await Complaint.find(query)
        .populate("ambassadorId", "firstName lastName email")
        .sort({ createdAt: -1 });
    
    res.json(complaints);
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { status, adminResponse } = req.body;
    const { id } = req.params;

    if (!["SUBMITTED", "UNDER_REVIEW", "RESOLVED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
        id,
        { status, adminResponse },
        { new: true }
    );

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(complaint);
};
