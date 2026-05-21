import { Request, Response } from "express";
import { Team, CapstoneSubmission } from "./capstone.model";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, segment, track, ideaDescription } = req.body;
    const founderId = req.user?.id;
    if (!founderId) return res.status(401).json({ message: "Unauthorized" });

    // Check if user is already in a team
    const existingTeam = await Team.findOne({ $or: [{ founder: founderId }, { members: founderId }] } as any);
    if (existingTeam) {
      return res.status(400).json({ message: "You are already part of a team" });
    }

    const newTeam = new Team({
      name,
      segment,
      track,
      ideaDescription,
      founder: founderId,
      members: [founderId] // Founder is automatically a member
    });

    await newTeam.save();
    return res.status(201).json({ message: "Team created successfully", team: newTeam });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.status === "CLOSED" || team.segment === "SOLO") {
      return res.status(400).json({ message: "This team is not open for new members" });
    }

    if (team.members.length >= 5) {
      return res.status(400).json({ message: "Team is already full (max 5 members)" });
    }

    // Check if user is already in another team
    const existingTeam = await Team.findOne({ $or: [{ founder: userId }, { members: userId }] } as any);
    if (existingTeam) {
      return res.status(400).json({ message: "You are already part of a team" });
    }

    team.members.push(userId as any);
    await team.save();

    return res.status(200).json({ message: "Joined team successfully", team });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find().populate("founder", "firstName lastName email").populate("members", "firstName lastName email");
    return res.status(200).json({ teams });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyTeam = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const team = await Team.findOne({ $or: [{ founder: userId }, { members: userId }] } as any)
            .populate("founder", "firstName lastName email")
            .populate("members", "firstName lastName email");
        
        if (!team) return res.status(404).json({ message: "You are not in a team yet" });
        return res.status(200).json({ team });
    } catch (error: any) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const submitProposal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { logoUrl, projectTitle, problemStatement, proposedSolution, targetBeneficiaries, islamicFinanceRelevance, innovationComponent, feasibility, expectedImpact } = req.body;

    const team = await Team.findOne({ founder: userId } as any);
    if (!team) return res.status(400).json({ message: "Only the team founder can submit the proposal" });

    const submission = new CapstoneSubmission({
      team: team._id,
      stage: "PROPOSAL",
      content: { logoUrl, projectTitle, problemStatement, proposedSolution, targetBeneficiaries, islamicFinanceRelevance, innovationComponent, feasibility, expectedImpact }
    });

    await submission.save();
    return res.status(201).json({ message: "Proposal submitted successfully", submission });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitPitchDeck = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { pitchDeckUrl } = req.body;

    const team = await Team.findOne({ founder: userId } as any);
    if (!team) return res.status(400).json({ message: "Only the team founder can submit the pitch deck" });

    const submission = new CapstoneSubmission({
      team: team._id,
      stage: "PITCH_DECK",
      content: { pitchDeckUrl }
    });

    await submission.save();
    return res.status(201).json({ message: "Pitch deck submitted successfully", submission });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const submissions = await CapstoneSubmission.find().populate("team");
    return res.status(200).json({ submissions });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { relevance, innovation, clarity, feasibility, presentation } = req.body;
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const submission = await CapstoneSubmission.findById(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const total = relevance + innovation + clarity + feasibility + presentation;
    const passed = total >= 70;

    submission.score = {
      relevance, innovation, clarity, feasibility, presentation, total, passed
    };
    submission.gradedBy = adminId as any;

    await submission.save();
    return res.status(200).json({ message: "Submission graded successfully", submission });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
