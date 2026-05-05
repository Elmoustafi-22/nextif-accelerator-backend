import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Ambassador from "./ambassador.model";
import Task from "../task/task.model";
import TaskSubmission from "../task/submission.model";
import { comparePassword, hashPassword } from "../../utils/password";
// Auth logic moved to modules/auth

/**
 * PROFILE
 */

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const ambassador = await Ambassador.findById(req.user.id);
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }
  res.json(ambassador);
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { phone, avatar, instagram, twitter, linkedin, facebook } = req.body;

  // Only allow updating specific profile fields (Restricting institution, courseOfStudy and names)
  const ambassador = await Ambassador.findByIdAndUpdate(
    req.user.id,
    {
      "profile.phone": phone,
      "profile.avatar": avatar,
      "profile.instagram": instagram,
      "profile.twitter": twitter,
      "profile.linkedin": linkedin,
      "profile.facebook": facebook,
    },
    { new: true, runValidators: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json(ambassador);
};

export const changeAmbassadorPassword = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;

  const ambassador = await Ambassador.findById(req.user.id).select("+password");
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  if (!ambassador.password) {
    return res
      .status(400)
      .json({ message: "Password not set for this account" });
  }

  // Verify current password
  const isMatch = comparePassword(currentPassword, ambassador.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect current password" });
  }

  // Hash and save new password
  ambassador.password = await hashPassword(newPassword);
  await ambassador.save();

  res.json({ message: "Password updated successfully" });
};

/**
 * DASHBOARD / STATS
 */

export const getAmbassadorStats = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user.id;

  try {
    // 1. Total Assigned Tasks
    const totalAssigned = await Task.countDocuments({
      assignedTo: req.user.id,
    });

    // 2. Completed Submissions (with populated task to get points)
    const completedSubmissions = await TaskSubmission.find({
      ambassadorId: req.user.id,
      status: "COMPLETED",
    }).populate("taskId", "rewardPoints");

    const completedCount = completedSubmissions.length;
    const pointsEarned = completedSubmissions.reduce((sum, sub) => {
      return sum + ((sub.taskId as any)?.rewardPoints || 0);
    }, 0);

    // 3. Pending (Submitted but not Verified)
    const pendingReview = await TaskSubmission.countDocuments({
      ambassadorId: req.user.id,
      status: "SUBMITTED",
    });

    // 4. Calculate Progress (Simple %)
    const completionRate =
      totalAssigned > 0
        ? Math.round((completedCount / totalAssigned) * 100)
        : 0;

    // 5. Calculate Global Rank
    // Note: For a serious implementation, we should cache this or use a leaderboard collection.
    // For now, we'll calculate it by aggregating points for all ambassadors.
    const leaderboard = await TaskSubmission.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $lookup: {
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: "$task" },
      {
        $group: {
          _id: "$ambassadorId",
          totalPoints: { $sum: "$task.rewardPoints" },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    const rankIndex = leaderboard.findIndex(
      (item) => item._id.toString() === userId.toString()
    );
    const globalRank =
      rankIndex !== -1 ? rankIndex + 1 : leaderboard.length + 1;

    // 6. Calculate Weekly Progress
    // Determine "This Week" range (Sunday to Saturday) relative to server time
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // Saturday

    console.log(`Checking stats for user ${userId}`);
    console.log(
      `Window: ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`
    );

    const currentWeekTasks = await Task.find({
      assignedTo: req.user.id,
      dueDate: { $gte: startOfWeek, $lte: endOfWeek },
    });

    console.log(`Found ${currentWeekTasks.length} tasks for this week`);
    currentWeekTasks.forEach((t) =>
      console.log(
        `- Task: ${t.title}, Due: ${t.dueDate.toISOString()}, Bonus: ${
          t.isBonus
        }`
      )
    );

    const mandatoryTasks = currentWeekTasks.filter((t) => !t.isBonus);
    const bonusTasks = currentWeekTasks.filter((t) => t.isBonus);

    const mandatoryCompleted = await TaskSubmission.countDocuments({
      ambassadorId: req.user.id,
      taskId: { $in: mandatoryTasks.map((t) => t._id) },
      status: "COMPLETED",
    });

    const bonusCompleted = await TaskSubmission.countDocuments({
      ambassadorId: req.user.id,
      taskId: { $in: bonusTasks.map((t) => t._id) },
      status: "COMPLETED",
    });

    console.log(`Mandatory: ${mandatoryCompleted}/${mandatoryTasks.length}`);
    console.log(`Bonus: ${bonusCompleted}/${bonusTasks.length}`);

    let weeklyProgress = 0;
    if (mandatoryTasks.length > 0) {
      weeklyProgress = (mandatoryCompleted / mandatoryTasks.length) * 100;
      if (bonusTasks.length > 0) {
        weeklyProgress += (bonusCompleted / bonusTasks.length) * 100;
      }
    } else if (bonusTasks.length > 0) {
      weeklyProgress = (bonusCompleted / bonusTasks.length) * 100;
    }

    console.log(`Final Weekly Progress: ${weeklyProgress}%`);

    res.json({
      totalAssigned,
      completedCount,
      pendingReview,
      completionRate,
      pointsEarned,
      globalRank: `#${globalRank}`,
      weeklyProgress: Math.min(Math.round(weeklyProgress), 200),
      mandatoryPending: mandatoryTasks.length - mandatoryCompleted,
      bonusPending: bonusTasks.length - bonusCompleted,
    });
  } catch (error) {
    console.error("Error in getAmbassadorStats:", error);
    res.status(500).json({ message: "Error fetching ambassador stats", error });
  }
};
