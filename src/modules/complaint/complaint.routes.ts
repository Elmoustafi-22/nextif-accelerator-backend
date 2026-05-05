import { Router } from "express";
import { 
    createComplaint, 
    getMyComplaints, 
    getAllComplaints, 
    updateComplaintStatus 
} from "./complaint.controller";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";

const complaintRouter = Router();

// Protect all routes
complaintRouter.use(protect);

// AMBASSADOR
complaintRouter.post("/", role(["AMBASSADOR"]), createComplaint);
complaintRouter.get("/my", role(["AMBASSADOR"]), getMyComplaints);

// ADMIN
complaintRouter.get("/", role(["ADMIN"]), getAllComplaints);
complaintRouter.patch("/:id/status", role(["ADMIN"]), updateComplaintStatus);

export default complaintRouter;
