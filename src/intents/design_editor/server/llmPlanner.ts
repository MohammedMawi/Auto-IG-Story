import "dotenv/config";
import OpenAI from "openai";
import { StoryPlanSchema } from "../planSchema";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODE_TO_TEMPLATE = {
  minimal: "t_min_01",
  bold: "t_bold_01",
  premium: "t_prem_01",
} as const;

export async function llmPlanStory(args: {
  prompt: string;
  style_mode: "minimal" | "bold" | "premium";
  brand?: string;
  cta?: string;
}) {
  const { prompt, style_mode, brand, cta } = args;

  const template_id = MODE_TO_TEMPLATE[style_mode];

  // Hard constraints (you already clamp again on the client)
  const headlineMax = 28;
  const subheadMax = 90;
  const ctaMax = 10;
  const footerMax = 30;

  const system = `
You generate Instagram Story copy + palette as STRICT JSON ONLY.

Return ONLY valid JSON matching EXACTLY:
{
  "style_mode": "minimal" | "bold" | "premium",
  "template_id": "t_min_01" | "t_bold_01" | "t_prem_01",
  "palette": { "bg": "#RRGGBB", "text": "#RRGGBB", "accent": "#RRGGBB" },
  "copy": { "headline": string, "subhead": string, "cta": string, "footer": string }
}

Rules:
- style_mode MUST be "${style_mode}"
- template_id MUST be "${template_id}"
- headline max ${headlineMax} chars, short + punchy
- subhead max ${subheadMax} chars, one sentence
- cta max ${ctaMax} chars (if user provided a CTA, prefer it)
- footer max ${footerMax} chars; if brand provided, use "@brand", else "@yourbrand"
- No extra keys. No markdown. No commentary.
`.trim();

  const user = JSON.stringify(
    {
      user_prompt: prompt,
      style_mode,
      brand: brand?.trim() || "",
      preferred_cta: cta?.trim() || "",
    },
    null,
    2
  );

  // Use Responses API, ask for JSON
  console.log("[llm] calling OpenAI with prompt:", prompt);
  const resp = await client.responses.create({
    model: "gpt-4.1-mini", // solid + cheap for this task
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    // Strong nudge toward JSON-only output
    text: { format: { type: "json_object" } },
  });

  const text = resp.output_text?.trim();
  console.log("[llm] raw response:", text.slice(0, 200));
  if (!text) throw new Error("Empty LLM response");

  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error(`LLM returned non-JSON: ${text.slice(0, 200)}`);
  }

  // Validate + coerce with Zod
  return StoryPlanSchema.parse(obj);
}
