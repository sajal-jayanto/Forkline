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
    .number({ error: "Master Price is required" })
    .positive("Master Price must be greater than 0")
    .multipleOf(0.01, "Master Price can have at most 2 decimal places"
  ),
});

export const assignOutletSchema =  z.object({
  outletId: z
    .number({ error: "outlet id is required." })
    .positive("outlet id must be positive."
  ),
  menuItemId: z
    .number({ error: "menu item id is required." })
    .positive("menu item id must be positive."
  ),
  priceOverride: z
    .number({ error: "Master Price is required" })
    .positive("Master Price must be greater than 0")
    .multipleOf(0.01, "Master Price can have at most 2 decimal places"
  ),
  availableUnit: z
    .number({ error: "Available Unit is required." })
    .positive("Available Unit must be positive."
  ),
})