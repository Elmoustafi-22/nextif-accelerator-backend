import { Request, Response } from "express";
import { verifySubmission } from "../task.controller";
import TaskSubmission from "../submission.model";
import Notification from "../../notification/notification.model";

// Mock the models
// Mock the models
jest.mock("../submission.model", () => ({
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../../notification/notification.model", () => ({
  create: jest.fn(),
}));
jest.mock("../../ambassador/ambassador.model", () => ({
  find: jest.fn(),
}));
jest.mock("../../../utils/email.service", () => ({
  EmailService: {
    sendTaskAssignedEmail: jest.fn(),
    sendTaskRedoEmail: jest.fn(),
  },
}));

import { EmailService } from "../../../utils/email.service";

describe("Task Controller - verifySubmission", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {
      params: { id: "submission123" },
      body: {},
    };
    jsonMock = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it("should update submission status and add feedback", async () => {
    req.body = { status: "COMPLETED", feedback: "Great job!" };

    const mockSubmission = {
      _id: "submission123",
      status: "COMPLETED",
      adminFeedback: "Great job!",
      ambassadorId: {
        _id: "ambassador123",
        firstName: "John",
        lastName: "Doe",
      },
      taskId: { _id: "task123", title: "Test Task" },
    };

    // Mock findByIdAndUpdate to return the mock submission with chained populate
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((onFulfilled) =>
        Promise.resolve(mockSubmission).then(onFulfilled)
      ),
      catch: jest.fn(),
    };
    (TaskSubmission.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

    await verifySubmission(req as Request, res as Response);

    // Verify update call checks for feedback
    expect(TaskSubmission.findByIdAndUpdate).toHaveBeenCalledWith(
      "submission123",
      expect.objectContaining({
        status: "COMPLETED",
        adminFeedback: "Great job!",
      }),
      { new: true }
    );

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "ambassador123",
        recipientRole: "AMBASSADOR",
        type: "MESSAGE",
        title: "Submission Update: Test Task",
        body: expect.stringContaining("Your submission has been COMPLETED"),
        referenceId: "task123",
      })
    );

    expect(res.json).toHaveBeenCalledWith(mockSubmission);
  });

  it("should return 400 for invalid status", async () => {
    req.body = { status: "INVALID" };
    await verifySubmission(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should handle REDO status and set individualDueDate", async () => {
    const newDate = "2026-02-01T10:00:00Z";
    req.body = {
      status: "REDO",
      feedback: "Fix the link",
      newDueDate: newDate,
    };
    req.user = { id: "admin123", role: "ADMIN" };

    const mockSubmission = {
      _id: "submission123",
      status: "REDO",
      adminFeedback: "Fix the link",
      individualDueDate: new Date(newDate),
      ambassadorId: {
        _id: "ambassador123",
        firstName: "John",
        email: "john@example.com",
      },
      taskId: { _id: "task123", title: "Test Task" },
    };

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((onFulfilled) =>
        Promise.resolve(mockSubmission).then(onFulfilled)
      ),
    };
    (TaskSubmission.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

    await verifySubmission(req as Request, res as Response);

    expect(TaskSubmission.findByIdAndUpdate).toHaveBeenCalledWith(
      "submission123",
      expect.objectContaining({
        status: "REDO",
        adminFeedback: "Fix the link",
        individualDueDate: expect.any(Date),
        reviewedBy: "admin123",
      }),
      { new: true }
    );

    expect(EmailService.sendTaskRedoEmail).toHaveBeenCalledWith(
      "john@example.com",
      "John",
      "Test Task",
      "Fix the link",
      expect.any(Date)
    );

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "ambassador123",
        recipientRole: "AMBASSADOR",
        type: "MESSAGE",
        title: "Submission Update: Test Task",
        body: expect.stringContaining("Your submission has been REDO"),
        referenceId: "task123",
      })
    );

    expect(res.json).toHaveBeenCalledWith(mockSubmission);
  });
});
