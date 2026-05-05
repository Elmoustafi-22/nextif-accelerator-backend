import { Router } from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  verifySubmission,
  getMyTasks,
  submitTask,
  getSubmissions,
} from "./task.controller";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../../utils/validation.schemas";

const taskRouter = Router();

// Protect all routes
taskRouter.use(protect);

// ADMIN ROUTES (Specific routes first)
taskRouter.get("/submissions", role(["ADMIN"]), getSubmissions);
taskRouter.patch("/submissions/:id/verify", role(["ADMIN"]), verifySubmission);

// AMBASSADOR ROUTES
taskRouter.get("/my/all", role(["AMBASSADOR"]), getMyTasks);
taskRouter.post(
  "/:id/submit",
  role(["AMBASSADOR"]),
  upload.array("proofFiles"),
  submitTask
);

// ADMIN GENERIC ROUTES
taskRouter.post("/", role(["ADMIN"]), validate(createTaskSchema), createTask);
taskRouter.get("/", role(["ADMIN"]), getAllTasks);

// SHARED GENERIC ROUTES
taskRouter.get("/:id", getTaskById);

// ADMIN GENERIC ROUTES (Continued)
taskRouter.patch(
  "/:id",
  role(["ADMIN"]),
  validate(updateTaskSchema),
  updateTask
);
taskRouter.delete("/:id", role(["ADMIN"]), deleteTask);

export default taskRouter;
