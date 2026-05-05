import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Admin from "./admin.model";
import Ambassador from "../ambassador/ambassador.model";
import { hashPassword } from "../../utils/password";
import { parse } from "csv-parse/sync";
import { NotificationService } from "../notification/notification.service";
import TaskSubmission from "../task/submission.model";
import Complaint from "../complaint/complaint.model";
import Notification from "../notification/notification.model";
import Task from "../task/task.model";
import { EmailService } from "../../utils/email.service";

/**
 * MESSAGING / ANNOUCEMENTS
 */

export const sendMessage = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { ambassadorId, title, body } = req.body;

  // Verify ambassador exists
  const ambassador = await Ambassador.findById(ambassadorId);
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  const notification = await NotificationService.send(
    ambassadorId,
    "AMBASSADOR",
    "MESSAGE",
    title,
    body
  );

  res.status(201).json(notification);
};

export const sendAnnouncement = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { title, body } = req.body;

  // Get all Active Ambassadors
  const ambassadors = await Ambassador.find({ accountStatus: "ACTIVE" });
  const ambassadorIds = ambassadors.map((a) => a._id);

  await NotificationService.broadcast(
    ambassadorIds,
    "AMBASSADOR",
    "ANNOUNCEMENT",
    title,
    body
  );

  res.status(201).json({
    message: `Announcement sent to ${ambassadorIds.length} ambassadors`,
  });
};

/**
 * ADMIN PROFILE
 */

export const getAdminProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  res.json(admin);
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { firstName, lastName, title, avatar } = req.body;
  const admin = await Admin.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, title, avatar },
    { new: true, runValidators: true }
  );
  res.json(admin);
};

export const changeAdminPassword = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.user.id).select("+password");
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect current password" });
  }

  // Hash and save new password
  admin.password = await hashPassword(newPassword);
  await admin.save();

  res.json({ message: "Password updated successfully" });
};

/**
 * AMBASSADOR MANAGEMENT
 */

export const getAllAmbassadors = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { page = 1, limit = 50, status, search } = req.query;

  const query: any = {};
  if (status) query.accountStatus = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const ambassadors = await Ambassador.find(query)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Ambassador.countDocuments(query);

  res.json({
    data: ambassadors,
    meta: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const createAmbassador = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const {
    firstName,
    lastName,
    email,
    institution,
    courseOfStudy,
    instagram,
    twitter,
    linkedin,
    facebook,
  } = req.body;

  const existing = await Ambassador.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Ambassador with this email already exists" });
  }

  // Check if email belongs to an admin
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return res.status(400).json({ message: "Email already in use" });
  }

  // Create with PRELOADED status
  const ambassador = await Ambassador.create({
    firstName,
    lastName,
    email,
    profile: {
      institution,
      courseOfStudy,
      instagram,
      twitter,
      linkedin,
      facebook,
    },
    accountStatus: "PRELOADED",
    passwordSet: false,
    role: "AMBASSADOR",
  });

  // Send Welcome Email
  try {
    await EmailService.sendAmbassadorWelcomeEmail(
      ambassador.email,
      ambassador.firstName,
      ambassador.lastName
    );
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Continue anyway since ambassador is created
  }

  res.status(201).json(ambassador);
};

export const getAmbassadorById = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const ambassador = await Ambassador.findById(req.params.id);
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }
  res.json(ambassador);
};

export const updateAmbassador = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    institution,
    courseOfStudy,
    instagram,
    twitter,
    linkedin,
    facebook,
  } = req.body;

  // Check if email is being changed and if it's already in use
  if (email) {
    const emailLower = email.toLowerCase();
    const existingAmbassador = await Ambassador.findOne({
      email: emailLower,
      _id: { $ne: id }, // Exclude current ambassador
    });

    if (existingAmbassador) {
      return res.status(400).json({
        message: "Email already in use by another ambassador",
      });
    }

    // Optional: Check if email belongs to an admin
    const existingAdmin = await Admin.findOne({ email: emailLower });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }
  }

  const updateData: any = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email.toLowerCase();

  // Social media and Institution are in profile object
  if (
    institution ||
    courseOfStudy ||
    instagram ||
    twitter ||
    linkedin ||
    facebook
  ) {
    updateData.profile = {};
    if (institution) updateData["profile.institution"] = institution;
    if (courseOfStudy) updateData["profile.courseOfStudy"] = courseOfStudy;
    if (instagram) updateData["profile.instagram"] = instagram;
    if (twitter) updateData["profile.twitter"] = twitter;
    if (linkedin) updateData["profile.linkedin"] = linkedin;
    if (facebook) updateData["profile.facebook"] = facebook;

    // For nested objects using dots is often better with findByIdAndUpdate
    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
          email: email?.toLowerCase(),
          "profile.institution": institution,
          "profile.courseOfStudy": courseOfStudy,
          "profile.instagram": instagram,
          "profile.twitter": twitter,
          "profile.linkedin": linkedin,
          "profile.facebook": facebook,
        },
      },
      { new: true, runValidators: true }
    );

    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }
    return res.json(ambassador);
  }

  const ambassador = await Ambassador.findByIdAndUpdate(
    id,
    { firstName, lastName, email: email?.toLowerCase() },
    { new: true, runValidators: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json(ambassador);
};

export const updateAmbassadorStatus = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { status } = req.body;
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status update" });
  }

  const ambassador = await Ambassador.findByIdAndUpdate(
    req.params.id,
    { accountStatus: status },
    { new: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json(ambassador);
};

export const bulkOnboardAmbassadors = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  try {
    const fileContent = req.file.buffer.toString();
    const rawLines = parse(fileContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];

    if (rawLines.length < 2) {
      return res.status(400).json({ message: "CSV file is empty or invalid" });
    }

    // Find the header row (contains 'email')
    let headerIndex = -1;
    for (let i = 0; i < Math.min(rawLines.length, 5); i++) {
      if (rawLines[i]?.some((cell) => cell.toLowerCase().includes("email"))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return res
        .status(400)
        .json({ message: "Could not find a header row with 'EMAIL' column" });
    }

    const headers = rawLines[headerIndex]!.map((h) => h.toLowerCase().trim());
    const dataRows = rawLines.slice(headerIndex + 1);

    const results: any[] = [];
    const errors: any[] = [];

    for (const row of dataRows) {
      const record: any = {};
      headers.forEach((h, index) => {
        if (row[index] !== undefined) {
          record[h] = row[index];
        }
      });

      // Flexible mapping
      let email = record.email || record["email address"];
      let firstName = record.firstname || record["first name"];
      let lastName = record.lastname || record["last name"];
      const fullName = record["full name"] || record["name"];
      const institution =
        record.institution || record.institutions || record.university;
      const courseOfStudy =
        record.courseofstudy ||
        record["course of study"] ||
        record.course ||
        record["course of study"];

      // Handle Full Name splitting if first/last are missing
      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        } else {
          firstName = fullName;
          lastName = " "; // Default or empty
        }
      }

      const phone = record.phone || record["phone number"] || record.tel;

      if (!email || !firstName || !lastName || !institution || !courseOfStudy) {
        errors.push({
          record,
          message: `Missing required fields: ${[
            !email && "email",
            !firstName && "firstName",
            !lastName && "lastName",
            !institution && "institution",
            !courseOfStudy && "courseOfStudy",
          ]
            .filter(Boolean)
            .join(", ")}`,
        });
        continue;
      }

      const existing = await Ambassador.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existing) {
        errors.push({ email, message: "Already exists" });
        continue;
      }

      // Check if email belongs to an admin
      const existingAdmin = await Admin.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingAdmin) {
        errors.push({ email, message: "Email already in use" });
        continue;
      }

      const newAmbassador = await Ambassador.create({
        firstName: firstName.trim(),
        lastName: (lastName || "").trim(),
        email: email.toLowerCase().trim(),
        profile: {
          institution: institution.trim(),
          courseOfStudy: (courseOfStudy || "").trim(),
          phone: (phone || "").trim(),
        },
        accountStatus: "PRELOADED",
        passwordSet: false,
        role: "AMBASSADOR",
      });

      // Send Welcome Email
      try {
        await EmailService.sendAmbassadorWelcomeEmail(
          newAmbassador.email,
          newAmbassador.firstName,
          newAmbassador.lastName
        );
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
      }

      results.push(newAmbassador);
    }

    res.json({
      message: "Bulk processing complete",
      successCount: results.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error parsing CSV", error });
  }
};
export const forceResetAmbassadorPassword = async (
  req: Request,
  res: Response
) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  const ambassador = await Ambassador.findByIdAndUpdate(
    id,
    {
      passwordSet: false,
      accountStatus: "PASSWORD_PENDING",
    },
    { new: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json({
    message:
      "Ambassador password reset triggered. They must reset on next login.",
    data: ambassador,
  });
};

export const getDashboardStats = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [
      activeAmbassadors,
      pendingSubmissions,
      openComplaints,
      totalNotifications,
    ] = await Promise.all([
      Ambassador.countDocuments({ accountStatus: "ACTIVE" }),
      TaskSubmission.countDocuments({ status: "SUBMITTED" }),
      Complaint.countDocuments({
        status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      }),
      Notification.countDocuments({ recipientRole: "AMBASSADOR" }),
    ]);

    const recentActivity = await TaskSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate({
        path: "ambassadorId",
        select: "firstName lastName",
      })
      .populate({
        path: "taskId",
        select: "title",
      });

    res.json({
      stats: {
        activeAmbassadors,
        pendingSubmissions,
        openComplaints,
        messagesSent: totalNotifications,
      },
      recentActivity: recentActivity.map((item) => ({
        id: item._id,
        ambassadorName: item.ambassadorId
          ? `${(item.ambassadorId as any).firstName} ${
              (item.ambassadorId as any).lastName
            }`
          : "Unknown",
        taskTitle: item.taskId ? (item.taskId as any).title : "Unknown Task",
        status: item.status,
        time: item.submittedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats", error });
  }
};

export const deleteAmbassador = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const ambassador = await Ambassador.findByIdAndDelete(req.params.id);
    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }
    res.json({ message: "Ambassador deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ambassador", error });
  }
};

/**
 * ADMIN DIRECTORY & MESSAGING
 */

export const getAllAdmins = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const admins = await Admin.find({ _id: { $ne: req.user.id } }) // Exclude self
    .select("firstName lastName email title avatar accountStatus createdAt")
    .sort({ createdAt: -1 });

  res.json(admins);
};

export const getAdminById = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const admin = await Admin.findById(req.params.id).select(
    "-password -passwordResetToken -passwordResetExpires"
  );
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json(admin);
};

export const sendAdminMessage = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { recipientId, title, body } = req.body;

  // Verify recipient exists
  const recipient = await Admin.findById(recipientId);
  if (!recipient) {
    return res.status(404).json({ message: "Admin recipient not found" });
  }

  const notification = await NotificationService.send(
    recipientId,
    "ADMIN",
    "MESSAGE",
    title,
    body
  );

  res.status(201).json(notification);
};
