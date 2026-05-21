import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import {
  createTeam,
  joinTeam,
  getTeams,
  getMyTeam,
  submitProposal,
  submitPitchDeck,
  getSubmissions,
  gradeSubmission,
} from "./capstone.controller";

const router = Router();

// Mentee Routes
router.post("/teams", protect, createTeam);
router.post("/teams/:teamId/join", protect, joinTeam);
router.get("/teams/me", protect, getMyTeam);
router.post("/submissions/proposal", protect, submitProposal);
router.post("/submissions/pitch-deck", protect, submitPitchDeck);

// Admin / Public Routes (Consider adding admin middleware to protect these)
router.get("/teams", protect, getTeams);
router.get("/submissions", protect, getSubmissions);
router.post("/submissions/:id/grade", protect, gradeSubmission); // Should be admin-only ideally

export default router;
