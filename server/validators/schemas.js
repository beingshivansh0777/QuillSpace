import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
    email: z.string().trim().toLowerCase().email("Please enter a valid email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email."),
    password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email."),
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters."),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

export const createReportSchema = z.object({
    targetType: z.enum(["blog", "comment"], { message: "Invalid report type." }),
    targetId: z.string().min(1, "Target ID is required."),
    reason: z.string().trim().min(1, "Please describe the issue.").max(300),
});

export const addCommentSchema = z.object({
    blog: z.string().min(1, "Blog ID is required."),
    content: z.string().trim().min(1, "Comment can't be empty.").max(1000),
    parent: z.string().optional().nullable(),
});