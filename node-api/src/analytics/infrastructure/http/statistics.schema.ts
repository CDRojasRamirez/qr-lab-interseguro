import { z } from 'zod';

/** Request body of POST /api/v1/statistics. `z.number()` rejects NaN and Infinity. */
export const statisticsRequestSchema = z.object({
  matrices: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.array(z.number())),
      }),
    )
    .min(1),
});

export type StatisticsRequestDto = z.infer<typeof statisticsRequestSchema>;
