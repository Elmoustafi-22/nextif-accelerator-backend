import { Request, Response } from "express";
import Task from "./task.model";
import TaskSubmission from "./submission.model";
import Notification from "../notification/notification.model";
import Ambassador from "../ambassador/ambassador.model";
import { EmailService } from "../../utils/email.service";
import { Types } from "mongoose";

/**
 * SHARED: TASK VIEWING
 */

export const getTaskById = async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id).populate(
    "createdBy",
    "firstName lastName"
  );
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // If ambassador, check if assigned and attach submission status
  if (req.user?.role === "AMBASSADOR") {
    if (!task.assignedTo.map((id) => id.toString()).includes(req.user.id)) {
      return res.status(403).json({ message: "Task not assigned to you" });
    }

    const submission = await TaskSubmission.findOne({
      taskId: task._id,
      ambassadorId: req.user.id,
    });

    return res.json({
      ...task.toObject(),
      status: submission ? submission.status : "PENDING",
    });
  }

  res.json(task);
};

/**
 * ADMIN: TASK MANAGEMENT
 */

export const createTask = async (req: Request, res: Response) => {
  const {
    title,
    explanation,
    type,
    verificationType,
    dueDate,
    assignedTo,
    rewardPoints,
    isBonus,
    requirements,
    whatToDo,
    materials,
  } = req.body;

  const task = await Task.create({
    title,
    explanation,
    type,
    verificationType,
    dueDate,
    assignedTo,
    rewardPoints,
    isBonus,
    requirements,
    whatToDo: whatToDo || [],
    materials: materials || [],
    createdBy: new Types.ObjectId(req.user!.id),
  });

  res.status(201).json(task);

  // Send assignment emails
  if (assignedTo && assignedTo.length > 0) {
    try {
      const ambassadors = await Ambassador.find({ _id: { $in: assignedTo } });
      for (const ambassador of ambassadors) {
        await EmailService.sendTaskAssignedEmail(
          ambassador.email,
          ambassador.firstName,
          task.title,
          task.dueDate
        );
      }
    } catch (error) {
      console.error("Failed to send assignment emails:", error);
    }
  }
};

export const getAllTasks = async (req: Request, res: Response) => {
  const tasks = await Task.find()
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 });
  res.json(tasks);
};

export const updateTask = async (req: Request, res: Response) => {
  const oldTask = await Task.findById(req.params.id);
  if (!oldTask) {
    return res.status(404).json({ message: "Task not found" });
  }

  const oldAssignedTo = oldTask.assignedTo.map((id) => id.toString());
  const newAssignedTo = req.body.assignedTo || [];

  // Find newly assigned mentees who weren't assigned before
  const newlyAssigned = newAssignedTo.filter(
    (id: string) => !oldAssignedTo.includes(id.toString())
  );

  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found after update" });
  }

  // Send assignment emails ONLY to newly assigned mentees
  if (newlyAssigned.length > 0) {
    try {
      const ambassadors = await Ambassador.find({
        _id: { $in: newlyAssigned },
      });
      for (const ambassador of ambassadors) {
        await EmailService.sendTaskAssignedEmail(
          ambassador.email,
          ambassador.firstName,
          task.title,
          task.dueDate
        );
      }
    } catch (error) {
      console.error(
        "Failed to send assignment emails to new assignees:",
        error
      );
    }
  }

  res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  // Optional: Delete related submissions? Keeping them for history might be better.
  // await TaskSubmission.deleteMany({ taskId: req.params.id });

  res.json({ message: "Task deleted successfully" });
};

/**
 * ADMIN: SUBMISSION VIEWING
 */

export const getSubmissions = async (req: Request, res: Response) => {
  const { taskId, ambassadorId, status } = req.query;

  const query: any = {};
  if (taskId) query.taskId = taskId;
  if (ambassadorId) query.ambassadorId = ambassadorId;
  if (status) query.status = status;

  const submissions = await TaskSubmission.find(query)
    .populate("ambassadorId", "firstName lastName email university")
    .populate("taskId", "title")
    .populate("reviewedBy", "title role")
    .sort({ submittedAt: -1 });

  res.json(submissions);
};

export const exportSubmissionsReport = async (req: Request, res: Response) => {
  try {
    const [fellows, tasks] = await Promise.all([
      Ambassador.find({}, "firstName lastName email").sort({ firstName: 1 }),
      Task.find({}, "title").sort({ dueDate: 1 }),
    ]);

    const submissions = await TaskSubmission.find(
      { status: "COMPLETED" },
      "ambassadorId taskId pointsAwarded"
    ).populate("taskId", "rewardPoints");

    // Create a map for quick lookup: ambassadorId -> taskId -> points
    const scoreMap: Record<string, Record<string, number>> = {};
    submissions.forEach((sub) => {
      if (!sub.ambassadorId || !sub.taskId) return; // Skip if ambassador or task is missing

      const ambassadorId = sub.ambassadorId.toString();
      const taskId = (sub.taskId as any)._id.toString();
      const points = sub.pointsAwarded || (sub.taskId as any).rewardPoints || 0;
      
      if (!scoreMap[ambassadorId]) {
        scoreMap[ambassadorId] = {};
      }
      scoreMap[ambassadorId][taskId] = points;
    });

    // Prepare CSV Content
    let csvContent =
      "Name," +
      tasks.map((t) => `"${t.title.replace(/"/g, '""')}"`).join(",") +
      ",Total Points\n";

    fellows.forEach((fellow) => {
      const fellowId = fellow._id.toString();
      let row = `"${fellow.firstName} ${fellow.lastName}"`;
      let totalPoints = 0;

      tasks.forEach((task) => {
        const taskId = task._id.toString();
        const points = scoreMap[fellowId]?.[taskId] || 0;
        row += `,${points}`;
        totalPoints += points;
      });

      row += `,${totalPoints}\n`;
      csvContent += row;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=task_performance_report.csv"
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Error generating export", error });
  }
};

/**
 * ADMIN: SUBMISSION VERIFICATION
 */

export const verifySubmission = async (req: Request, res: Response) => {
  const { status, feedback, grade } = req.body; // "COMPLETED", "REJECTED", "REDO"
  const { id } = req.params; // Submission ID

  if (!["COMPLETED", "REJECTED", "REDO"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use COMPLETED, REJECTED, or REDO." });
  }

  // Ensure grade is provided for COMPLETED status
  if (status === "COMPLETED" && (!grade || grade < 1 || grade > 5)) {
    return res.status(400).json({ message: "A grade between 1 and 5 is required for verification." });
  }

  const existingSubmission = await TaskSubmission.findById(id);
  if (!existingSubmission) {
    return res.status(404).json({ message: "Submission not found" });
  }
  const oldStatus = existingSubmission.status;
  const oldPoints = (existingSubmission as any).pointsAwarded || 0;

  // Points to award/deduct
  const pointsToAward = status === "COMPLETED" ? Number(grade) : 0;

  const submission = await TaskSubmission.findByIdAndUpdate(
    id,
    {
      status,
      adminFeedback: feedback,
      grade: status === "COMPLETED" ? Number(grade) : existingSubmission.grade,
      pointsAwarded: pointsToAward,
      reviewedAt: new Date(),
      reviewedBy: req.user?.id,
    },
    { new: true }
  )
    .populate("taskId", "title rewardPoints")
    .populate("ambassadorId", "firstName lastName email university")
    .populate("reviewedBy", "title role");

  if (!submission) {
    return res.status(404).json({ message: "Submission update failed" });
  }

  // Notify Ambassador
  try {
    const task = submission.taskId as any;
    const taskTitle = task.title;
    const ambassador = submission.ambassadorId as any;

    await Notification.create({
      recipientId: ambassador._id,
      recipientRole: "AMBASSADOR",
      type: "MESSAGE",
      title:
        status === "COMPLETED"
          ? `Task Verified: ${taskTitle}`
          : status === "REJECTED"
          ? `Task Rejected: ${taskTitle}`
          : `Revision Needed: ${taskTitle}`,
      body:
        status === "COMPLETED"
          ? `Excellent work! Your submission for "${taskTitle}" has been verified with a Grade ${grade}/5. You earned ${pointsToAward} points.`
          : status === "REJECTED"
          ? `Your submission for "${taskTitle}" was rejected. Reason: "${feedback}"`
          : `Your submission for "${taskTitle}" requires revision. Feedback: "${feedback}"`,
      read: false,
      referenceId: task._id,
    });

    // Handle Point Reversal if it was COMPLETED before
    if (oldStatus === "COMPLETED" && status !== "COMPLETED") {
      await Ambassador.findByIdAndUpdate(ambassador._id, {
        $inc: { points: -oldPoints },
      });
    }

    // Award New Points
    if (status === "COMPLETED") {
      // If it was already completed, we subtract old points first (if they changed)
      // but the logic above handles reversal if moving AWAY from completed.
      // If it's STAYING completed but grade changed:
      const pointsDiff = pointsToAward - (oldStatus === "COMPLETED" ? oldPoints : 0);
      
      if (pointsDiff !== 0) {
        await Ambassador.findByIdAndUpdate(ambassador._id, {
          $inc: { points: pointsDiff },
        });
      }

      await EmailService.sendTaskSuccessEmail(
        ambassador.email,
        ambassador.firstName,
        taskTitle,
        pointsToAward
      );
    } else if (status === "REDO" && oldStatus !== "REDO") {
      await EmailService.sendTaskRedoEmail(
        ambassador.email,
        ambassador.firstName,
        taskTitle,
        feedback || "Please review the instructions and resubmit your work."
      );
    } else if (status === "REJECTED" && oldStatus !== "REJECTED") {
      await EmailService.sendTaskRejectedEmail(
        ambassador.email,
        ambassador.firstName,
        taskTitle,
        feedback || "Your task submission was not accepted."
      );
    }
  } catch (error) {
    console.error("Failed to send notification/email:", error);
  }

  res.json(submission);
};

/**
 * AMBASSADOR: MY TASKS
 */

export const getMyTasks = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  // 1. Get tasks assigned to this ambassador
  const tasks = await Task.find({
    assignedTo: req.user.id,
  })
    .populate("createdBy", "firstName lastName")
    .sort({ dueDate: 1 });

  // 2. Get submissions for these tasks by this ambassador
  const submissions = await TaskSubmission.find({
    ambassadorId: req.user.id,
    taskId: { $in: tasks.map((t) => t._id) },
  });

  // 3. Merge data
  console.log(
    `Getting tasks for user ${req.user.id}. Total found: ${tasks.length}`
  );
  tasks.forEach((t) =>
    console.log(
      `- Task: ${t.title}, Due: ${t.dueDate.toISOString()}, isBonus: ${
        t.isBonus
      }`
    )
  );

  const result = tasks.map((task) => {
    const submission = submissions.find(
      (s) => s.taskId.toString() === task._id.toString()
    );
    return {
      ...task.toObject(),
      status: submission ? submission.status : "PENDING",
      dueDate:
        submission &&
        submission.status === "REDO" &&
        submission.individualDueDate
          ? submission.individualDueDate
          : task.dueDate,
      submission: submission || null,
    };
  });

  res.json(result);
};

export const submitTask = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params; // taskId from URL
  let { content, links, responses } = req.body; // text content, links array, and step responses

  // Parse responses if sent as string (FormData sends arrays/objects as strings)
  if (typeof responses === "string") {
    try {
      responses = JSON.parse(responses);
    } catch (e) {
      console.error("Failed to parse responses JSON:", e);
    }
  }

  // Parse links if sent as string/array from FormData
  if (typeof links === "string") {
    try {
      links = JSON.parse(links);
    } catch (e) {
      links = [links];
    }
  }

  // Debug logging for file uploads
  console.log("Files received:", req.files);
  console.log("Body proofFiles:", req.body.proofFiles);

  // If files were uploaded via multer, they will be in req.files
  const files = req.files as Express.Multer.File[];
  const proofFiles = files
    ? files.map((f: any) => f.path || f.url || (f as any).secure_url)
    : req.body.proofFiles || [];

  console.log("Mapped proofFiles:", proofFiles);

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // Check if there's a submission for individual due date (Redo)
  const existingSubmission = await TaskSubmission.findOne({
    taskId: id as string,
    ambassadorId: req.user.id,
  });

  const dueDate =
    existingSubmission &&
    existingSubmission.status === "REDO" &&
    existingSubmission.individualDueDate
      ? existingSubmission.individualDueDate
      : task.dueDate;

  // Check if assigned
  if (!task.assignedTo.map((aid) => aid.toString()).includes(req.user.id)) {
    return res.status(403).json({ message: "Task not assigned to you" });
  }

  // Check deadline
  if (new Date() > new Date(dueDate)) {
    return res.status(400).json({ message: "Submission deadline has passed" });
  }

  // Determine Status: All tasks now require manual admin verification
  const status = "SUBMITTED";

  console.log(
    `Submitting task ${id} for user ${req.user.id}, setting status to ${status}`
  );

  // Upsert submission
  const submission = await (TaskSubmission as any).findOneAndUpdate(
    { taskId: id, ambassadorId: req.user.id },
    {
      taskId: id,
      ambassadorId: req.user.id,
      proofFiles,
      links,
      responses,
      content,
      status,
      submittedAt: new Date(),
    },
    { returnDocument: 'after', upsert: true }
  );

  res.json(submission);
};
