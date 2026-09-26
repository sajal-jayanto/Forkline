import { z } from "zod";

const dateRangeShape = {
  from: z.iso.date({ error: "from must be a date in YYYY-MM-DD format." }).optional(),
  to: z.iso.date({ error: "to must be a date in YYYY-MM-DD format." }).optional(),
};

const isValidDateRange = ({ from, to }: { from?: string; to?: string }) => !from || !to || from <= to;
const invalidDateRange = { error: "from must be on or before to.", path: ["from"] };

export const revenueByOutletQuerySchema = z
  .object(dateRangeShape)
  .refine(isValidDateRange, invalidDateRange);

export const topItemsByOutletQuerySchema = z
  .object({
    ...dateRangeShape,
    limit: z.coerce
      .number({ error: "limit must be a number." })
      .int("limit must be an integer.")
      .min(1, "limit must be at least 1.")
      .max(50, "limit must be at most 50.")
      .default(5),
  })
  .refine(isValidDateRange, invalidDateRange);

export type RevenueByOutletQuery = z.infer<typeof revenueByOutletQuerySchema>;
export type TopItemsByOutletQuery = z.infer<typeof topItemsByOutletQuerySchema>;
