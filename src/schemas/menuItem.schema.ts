import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z
    .string({ error: "Item name is required." })
    .trim()
    .min(1, "Item name cannot be empty.")
    .max(255, "Item name must be at most 255 characters."),
  description: z
    .string()
    .trim()
    .optional(),
  imageUrl: z
    .string()
    .trim()
    .url("Invalid image URL.")
    .optional(),
  masterPrice: z
    .number({ error: "Master price is required." })
    .positive("Master price must be greater than 0.")
    .multipleOf(0.01, "Master price can have at most 2 decimal places."),
});

export const assignOutletSchema = z.object({
  outletId: z
    .number({ error: "Outlet ID is required." })
    .int("Outlet ID must be an integer.")
    .positive("Outlet ID must be positive."),
  menuItemId: z
    .number({ error: "Menu item ID is required." })
    .int("Menu item ID must be an integer.")
    .positive("Menu item ID must be positive."),
  priceOverride: z
    .number({ error: "Price override is required." })
    .positive("Price override must be greater than 0.")
    .multipleOf(0.01, "Price override can have at most 2 decimal places."),
  availableUnit: z
    .number({ error: "Available unit is required." })
    .int("Available unit must be an integer.")
    .min(0, "Available unit cannot be negative."),
});