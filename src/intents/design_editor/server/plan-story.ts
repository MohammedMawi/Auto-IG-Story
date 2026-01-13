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

    // TODO: call your LLM here
    // For now, return a placeholder to prove the plumbing works:
    const draft = {
      style_mode: parsedMode,
      template_id:
        parsedMode === "premium" ? "t_prem_01" : parsedMode === "bold" ? "t_bold_01" : "t_min_01",
      palette:
        parsedMode === "minimal"
          ? { bg: "#0B0F1A", text: "#FFFFFF", accent: "#22C55E" }
          : parsedMode === "bold"
            ? { bg: "#0B0F1A", text: "#FFFFFF", accent: "#7C3AED" }
            : { bg: "#0A0A0A", text: "#F5F5F5", accent: "#C8A04D" },
      copy: {
        headline: cleanPrompt.toUpperCase(),
        subhead: "Limited stock. Set a reminder and don’t miss it.",
        cta: (cta || "Shop now").toString(),
        footer: brand ? `@${brand}` : "@yourbrand",
      },
    };

    // Try LLM plan, fallback to draft if anything goes wrong
    let finalPlan;
    let source: "llm" | "draft" = "draft";

    try {
      finalPlan = await llmPlanStory({ prompt: cleanPrompt, style_mode: parsedMode, brand, cta });
      finalPlan = StoryPlanSchema.parse(finalPlan);
      source = "llm";
    } catch (e) {
      finalPlan = StoryPlanSchema.parse(draft);
      source = "draft";
    }

    return res.json({ source, plan: finalPlan });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
});

export default router;
