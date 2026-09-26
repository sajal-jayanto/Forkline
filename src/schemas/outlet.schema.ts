import { z } from "zod";

export const createOutletSchema = z.object({
  name: z
    .string({ error: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(255, "Item name must be at most 255 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
});