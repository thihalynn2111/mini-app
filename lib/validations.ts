import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .optional(),
  bio: z
    .string()
    .max(160, "Bio must not exceed 160 characters")
    .optional()
    .nullable(),
  avatarUrl: z.string().optional(),
});

export const createPostSchema = z.object({
  content: z.string().max(1000, "Content cannot exceed 1000 characters"),
  imageUrl: z.string().optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(300, "Comment cannot exceed 300 characters"),
});
