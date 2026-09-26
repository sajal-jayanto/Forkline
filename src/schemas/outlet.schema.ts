import { z } from "zod";

export const createOutletSchema = z.object({
  name: z
    .string({ error: "Outlet name is required." })
    .trim()
    .min(1, { error: "Outlet name cannot be empty." })
    .max(255, { error: "Outlet name must be at most 255 characters." }),
  description: z
    .string()
    .trim()
    .optional(),
  location: z
    .string()
    .trim()
    .optional(),
});