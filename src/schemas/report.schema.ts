import { z } from "zod";

export const topItemsByOutletQuerySchema = z.object({
  outletId: z.coerce
    .number({ error: "outletId must be a number." })
    .int("outletId must be an integer.")
    .positive("outletId must be positive."),
});
