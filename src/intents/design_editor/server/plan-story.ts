import express from "express";
import { StoryPlanSchema, StyleModeSchema } from "../planSchema";
import { llmPlanStory } from "./llmPlanner";

const router = express.Router();

// POST endpoint at /plan-story
router.post("/plan-story", express.json(), async (req, res) => {
  try {
    const { prompt, style_mode, brand, cta } = req.body ?? {}; // Assigning state input values to req.body

    let cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";
    if (!cleanPrompt) cleanPrompt = "New product drop";

    // Validate style_mode using Zod schema
    const parsedMode = StyleModeSchema.parse(style_mode);

    let finalPlan = await llmPlanStory({ prompt: cleanPrompt, style_mode: parsedMode, brand, cta });
    finalPlan = StoryPlanSchema.parse(finalPlan);

    return res.json(finalPlan);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
});

export default router;
