import express from "express";
import { StoryPlanSchema, StyleModeSchema } from "../planSchema";
import { llmPlanStory } from "./llmPlanner";

const router = express.Router(); // New router instance

// POST endpoint at /plan-story
router.post("/plan-story", express.json(), async (req, res) => {
  try {
    const { prompt, style_mode, brand, cta } = req.body ?? {}; // Pulls fields out of the parsed JSON body

    // Basic validation and default prompt
    let cleanPrompt = typeof prompt === "string" ? prompt.trim() : "New product drop"; 

    // Validate style_mode using Zod schema
    const parsedMode = StyleModeSchema.parse(style_mode);

    let finalPlan = await llmPlanStory({ prompt: cleanPrompt, style_mode: parsedMode, brand, cta }); // Call the LLM planner
    finalPlan = StoryPlanSchema.parse(finalPlan); // Final validation to ensure correct structure

    return res.json(finalPlan); // Send back the plan as JSON
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
});

export default router;
