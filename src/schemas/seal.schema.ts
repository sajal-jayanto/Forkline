import { z } from "zod";

const saleItemSchema = z.object({
  menuItemId: z
    .number({ error: "Menu item ID is required." })
    .int("Menu item ID must be an integer.")
    .positive("Menu item ID must be positive."),
  quantity: z
    .number({ error: "Sale quantity is required." })
    .int("Sale quantity must be an integer.")
    .positive("Sale quantity must be greater than 0."),
});

export const createNewSaleSchema = z.object({
  outletId: z
    .number({ error: "Outlet ID is required." })
    .int("Outlet ID must be an integer.")
    .positive("Outlet ID must be positive."),
  items: z
    .array(saleItemSchema)
    .min(1, { error: "At least one menu item is required." }),
});