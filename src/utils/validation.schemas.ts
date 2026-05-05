import { z } from "zod";

// AUTH SCHEMAS
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const firstLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    lastName: z.string().min(1, "Last name is required"),
  }),
});

export const setupPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().optional(),
    title: z.string().optional(),
  }),
});

// TASK SCHEMAS
export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title too short"),
    explanation: z.string().min(10, "Explanation too short"),
    type: z.string().min(1, "Type is required"),
    verificationType: z.enum(["AUTO", "ADMIN"]),
    dueDate: z.string().min(1, "Due date is required"),
    assignedTo: z.array(z.string()).min(1, "Assign at least one ambassador"),
    rewardPoints: z.number().min(0, "Reward points must be at least 0"),
    isBonus: z.boolean().optional(),
    requirements: z
      .array(z.string())
      .min(1, "At least one requirement is needed"),
    whatToDo: z
      .array(
        z.object({
          title: z.string().min(1, "Item title is required"),
          description: z.string().min(1, "Item description is required"),
        })
      )
      .optional(),
    materials: z
      .array(
        z.object({
          title: z.string().min(1, "Material title is required"),
          url: z.string().url("Invalid material URL"),
          type: z.enum(["VIDEO", "PDF", "LINK"]),
        })
      )
      .optional(),
  }),
});

export const updateTaskSchema = createTaskSchema.partial();

export const submitTaskSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    links: z.array(z.string()).optional(),
    responses: z
      .array(
        z.object({
          whatToDoId: z.string(),
          text: z.string(),
        })
      )
      .optional(),
  }),
});

// AMBASSADOR SCHEMAS
export const createAmbassadorSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    institution: z.string().min(1, "University/Institution is required"),
    courseOfStudy: z.string().min(1, "Course of study is required"),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
  }),
});
