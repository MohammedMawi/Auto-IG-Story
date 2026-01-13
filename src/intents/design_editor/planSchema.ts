import { z } from "zod";

// Zod schemas for runtime validation and type inference from API's or user input

// Schema that defines the allowed style modes
export const StyleModeSchema = z.enum(["minimal", "bold", "premium"]);

// Schema that defines the structure of a story plan
export const StoryPlanSchema = z.object({
  style_mode: StyleModeSchema,
  template_id: z.string(),
  palette: z.object({
    bg: z.string(),
    text: z.string(),
    accent: z.string(),
  }),
  copy: z.object({
    headline: z.string(),
    subhead: z.string(),
    cta: z.string(),
    footer: z.string(),
  }),
});

// TypeScript types inferred to guarantee match with the runtime validator
export type StoryPlan = z.infer<typeof StoryPlanSchema>;
export type StyleMode = z.infer<typeof StyleModeSchema>;
