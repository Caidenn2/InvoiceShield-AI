import { z } from "zod";
export const localAISchema = z.object({
  summary: z.string().max(2000),
  findings: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "info"]),
        title: z.string().max(120),
        evidence: z.string().max(800),
        action: z.string().max(500),
      }),
    )
    .max(8),
});
export type LocalAIReport = z.infer<typeof localAISchema>;
export function parseLocalAI(value: string) {
  return localAISchema.parse(JSON.parse(value));
}
