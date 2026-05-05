import { Request, Response } from "express";
import { createTask } from "../task.controller";
import Task from "../task.model";
import Ambassador from "../../ambassador/ambassador.model";
import { EmailService } from "../../../utils/email.service";

// Mock the models and services
jest.mock("../task.model", () => ({
  create: jest.fn(),
}));
jest.mock("../../ambassador/ambassador.model", () => ({
  find: jest.fn(),
}));
jest.mock("../../../utils/email.service", () => ({
  EmailService: {
    sendTaskAssignedEmail: jest.fn(),
  },
}));

describe("Task Controller - createTask", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {
      body: {
        title: "Adhoc Task",
        explanation: "This is an adhoc task",
        type: "ADHOC",
        verificationType: "ADMIN",
        dueDate: "2026-02-01T10:00:00Z",
        assignedTo: ["amb1", "amb2"],
        rewardPoints: 100,
      },
    };
    jsonMock = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it("should create a task with ADHOC type and send emails", async () => {
    const mockTask = {
      _id: "task123",
      ...req.body,
      toObject: jest.fn().mockReturnThis(),
    };

    (Task.create as jest.Mock).mockResolvedValue(mockTask);
    (Ambassador.find as jest.Mock).mockResolvedValue([
      { _id: "amb1", email: "amb1@example.com", firstName: "Amb1" },
      { _id: "amb2", email: "amb2@example.com", firstName: "Amb2" },
    ]);

    await createTask(req as Request, res as Response);

    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADHOC",
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockTask);

    // Verify email service calls
    expect(EmailService.sendTaskAssignedEmail).toHaveBeenCalledTimes(2);
    expect(EmailService.sendTaskAssignedEmail).toHaveBeenCalledWith(
      "amb1@example.com",
      "Amb1",
      "Adhoc Task",
      req.body.dueDate
    );
  });
});
