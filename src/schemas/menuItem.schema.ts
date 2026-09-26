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

export const assignOutletSchema =  z.object({
  outletId: z
    .number({ error: "outlet id is required." })
    .positive("outlet id must be positive."),
  menuItemId: z
    .number({ error: "menu item id is required." })
    .positive("menu item id must be positive."),
  priceOverride: z
    .string({ error: "Price is required" })
    .regex(
      /^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/,
      "Price must be greater than 0 and have at most 2 decimal places",
    ),
  availableUnit: z
    .number({ error: "Available Unit is required." })
    .positive("Available Unit must be positive."),
})