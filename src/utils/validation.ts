import { z } from 'zod';

export const DiscoverInputSchema = z.object({
  need: z.string().min(1, 'Need is required'),
  constraints: z
    .object({
      max_latency_ms: z.number().positive().optional(),
      required_features: z.array(z.string()).optional(),
      exclude_servers: z.array(z.string()).optional(),
    })
    .optional(),
  limit: z.number().int().positive().max(20).default(5),
});

export const GetMetricsInputSchema = z.object({
  server_id: z.string().min(1, 'Server ID is required'),
  time_range: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
});

export const CompareInputSchema = z.object({
  server_ids: z
    .array(z.string())
    .min(2, 'At least 2 servers required for comparison')
    .max(10, 'Maximum 10 servers can be compared'),
  compare_by: z
    .array(z.enum(['latency', 'uptime', 'features']))
    .default(['latency', 'uptime', 'features']),
});

export type ValidatedDiscoverInput = z.infer<typeof DiscoverInputSchema>;
export type ValidatedGetMetricsInput = z.infer<typeof GetMetricsInputSchema>;
export type ValidatedCompareInput = z.infer<typeof CompareInputSchema>;

export function validateDiscoverInput(input: unknown): ValidatedDiscoverInput {
  return DiscoverInputSchema.parse(input);
}

export function validateGetMetricsInput(
  input: unknown
): ValidatedGetMetricsInput {
  return GetMetricsInputSchema.parse(input);
}

export function validateCompareInput(input: unknown): ValidatedCompareInput {
  return CompareInputSchema.parse(input);
}
