import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z
    .string({ error: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(255, "Item name must be at most 255 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  masterPrice: z
    .string({ error: "Price is required" })
    .regex(
      /^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/,
      "Price must be greater than 0 and have at most 2 decimal places",
    ),
});