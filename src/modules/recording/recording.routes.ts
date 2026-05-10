import { Router } from "express";
import { getRecordings, createRecording, deleteRecording } from "./recording.controller";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";

const router = Router();

router.get("/", protect, getRecordings);
router.post("/", protect, role(["ADMIN"]), createRecording);
router.delete("/:id", protect, role(["ADMIN"]), deleteRecording);

export default router;
