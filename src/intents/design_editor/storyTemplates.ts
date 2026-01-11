export type StyleMode = "minimal" | "bold" | "premium"; //Three style modes for templates

//Object for AI/LLM to fill after reading user's prompt
export type StoryPlan = {
  style_mode: StyleMode;
  template_id: string;
  palette: { bg: string; text: string; accent: string };
  copy: { headline: string; subhead: string; cta: string; footer: string };
};

//dimensions for canvas
export const STORY_W = 800;
export const STORY_H = 600;

//Defines contract for each element and attributes
type ElementSpec =
  | { kind: "bg" }
  | { kind: "accent_bar"; top: number; left: number; width: number; height: number; radius?: number }
  | { kind: "headline"; top: number; left: number; width: number; fontSize: number }
  | { kind: "subhead"; top: number; left: number; width: number; fontSize: number }
  | { kind: "cta_pill"; top: number; left: number; width: number; height: number; radius: number }
  | { kind: "cta_text"; top: number; left: number; width: number; fontSize: number }
  | { kind: "footer"; top: number; left: number; width: number; fontSize: number };

// Structure of templates: object that defines what each template should look like
export type StoryTemplate = {
  id: string;
  mode: StyleMode;
  name: string;
  elements: ElementSpec[];
};

// Array of StoryTemplate objects that holds the design of each template
export const TEMPLATES: StoryTemplate[] = [
  {
    id: "t_min_01",
    mode: "minimal",
    name: "Minimal — Top-left stack",
    elements: [
      { kind: "bg" },
      { kind: "headline", top: 50, left: 90, width: 900, fontSize: 60 }, //220 88
      { kind: "subhead", top: 233, left: 97, width: 820, fontSize: 26 }, //420 44
      { kind: "cta_pill", top: 413, left: 260, width: 280, height: 86, radius: 43 }, //560 280,86
      { kind: "cta_text", top: 435, left: 308, width: 280, fontSize: 36 },
      { kind: "footer", top: 1780, left: 90, width: 900, fontSize: 34 },
    ],
  },
  {
    id: "t_bold_01",
    mode: "bold",
    name: "Bold — Accent bar headline",
    elements: [
      { kind: "bg" },
      { kind: "accent_bar", top: 200, left: 70, width: 940, height: 220, radius: 36 },
      { kind: "headline", top: 240, left: 110, width: 860, fontSize: 108 },
      { kind: "subhead", top: 470, left: 110, width: 860, fontSize: 48 },
      { kind: "cta_pill", top: 640, left: 110, width: 320, height: 96, radius: 48 },
      { kind: "cta_text", top: 668, left: 110, width: 320, fontSize: 38 },
      { kind: "footer", top: 1760, left: 110, width: 860, fontSize: 34 },
    ],
  },
  {
    id: "t_prem_01",
    mode: "premium",
    name: "Premium — Centered with accent line",
    elements: [
      { kind: "bg" },
      { kind: "accent_bar", top: 520, left: 240, width: 600, height: 8, radius: 4 },
      { kind: "headline", top: 340, left: 140, width: 800, fontSize: 78 },
      { kind: "subhead", top: 560, left: 160, width: 760, fontSize: 40 },
      { kind: "cta_pill", top: 760, left: 380, width: 320, height: 84, radius: 42 },
      { kind: "cta_text", top: 784, left: 380, width: 320, fontSize: 34 },
      { kind: "footer", top: 1760, left: 140, width: 800, fontSize: 30 },
    ],
  },
];

//Helper function to grab the template based on template ID
export function getTemplate(templateId: string): StoryTemplate {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) throw new Error(`Unknown template_id: ${templateId}`);
  return t;
}

//Helper function to prevent text from overflowing from elements
function clampText(input: string, max: number): string {
  const s = (input ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

//Helper function that takes LLM output/user input and clamps text before being outputted on canvas
export function normalizePlan(plan: StoryPlan): StoryPlan {
  return {
    ...plan,
    copy: {
      headline: clampText(plan.copy.headline, 28),
      subhead: clampText(plan.copy.subhead, 90),
      cta: clampText(plan.copy.cta, 10),
      footer: clampText(plan.copy.footer, 30),
    },
  };
}
