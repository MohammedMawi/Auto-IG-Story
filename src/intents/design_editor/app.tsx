import { useMemo, useState } from "react";
import { useFeatureSupport } from "@canva/app-hooks";
import { Button, Rows, Text, TextInput, Select } from "@canva/app-ui-kit";
import { addPage, getCurrentPageContext  } from "@canva/design";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { rectShape } from "./canvaShapes";

import {
  getTemplate,
  normalizePlan,
  type StoryPlan,
  type StyleMode,
  STORY_W,
  STORY_H,
} from "./storyTemplates";
import { StoryPlanSchema } from "./planSchema";

// Object for default color palette for each style mode 
const DEFAULT_PALETTES: Record<StyleMode, { bg: string; text: string; accent: string }> = {
  minimal: { bg: "#0B0F1A", text: "#FFFFFF", accent: "#22C55E" },
  bold: { bg: "#0B0F1A", text: "#FFFFFF", accent: "#7C3AED" },
  premium: { bg: "#0A0A0A", text: "#F5F5F5", accent: "#C8A04D" },
};

// --- TEMP: local “fake LLM” so you can test rendering immediately.
// Replace this with a backend call next.
// function fakePlanner(prompt: string, mode: StyleMode, brand?: string, cta?: string): StoryPlan {
//   const b = brand?.trim() || "yourbrand";
//   const clean = prompt.trim() || "New product drop";

//   //check mode to get template ID
//   const template_id =
//     mode === "premium" ? "t_prem_01" : mode === "bold" ? "t_bold_01" : "t_min_01";

//   // Return StoryPlan with inputted values/placeholders
//   return {
//     style_mode: mode,
//     template_id,
//     palette: DEFAULT_PALETTES[mode],
//     copy: {
//       headline: clean.toUpperCase(),
//       subhead: "Limited stock. Set a reminder and don’t miss it.",
//       cta: cta?.trim() || "Shop now",
//       footer: `@${b} • This week`,
//     },
//   };
// }

// Async function that takes an object with arguments and returns a StoryPlan
async function planStoryFromApi(args: {
  prompt: string;
  style_mode: StyleMode;
  brand?: string;
  cta?: string;
}): Promise<StoryPlan> {
  const resp = await fetch("http://localhost:3001/api/plan-story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args), 
  }); // so this function sends data to the endpoint which returns a template to display?

  const rawText = await resp.text(); // read once
  if (!resp.ok) {
    throw new Error(`Planner failed (${resp.status}): ${rawText}`);
  }

  const rawJSON = JSON.parse(rawText);

  // TEMP: backend now returns { source, plan }
  const parsed = rawJSON.plan;
  console.log("planner source:", rawJSON.source);

  return StoryPlanSchema.parse(parsed);
}


export const App = () => {
  const intl = useIntl();
  const isSupported = useFeatureSupport();

  // States for the values in the input fields
  const [prompt, setPrompt] = useState("");
  const [styleMode, setStyleMode] = useState<StyleMode>("minimal");
  const [brand, setBrand] = useState("");
  const [cta, setCta] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const canAddPage = isSupported(addPage);

  const onGenerate = async () => {
    if (!canAddPage) return;

    setIsGenerating(true);

    try {
      const rawPlan = await planStoryFromApi({prompt, style_mode: styleMode, brand, cta});
      const plan = normalizePlan(rawPlan);
      const template = getTemplate(plan.template_id);

      const elements: any[] = [];

      const ctx = await getCurrentPageContext();
      if (!ctx.dimensions) {
        throw new Error("This page has no fixed dimensions. Use a Photo design page.");
      }
      const pageW = ctx.dimensions.width;
      const pageH = ctx.dimensions.height;

      const sx = pageW / STORY_W;
      const sy = pageH / STORY_H;
      const sText = sx;

      const X = (n: number) => Math.round(n * sx);
      const Y = (n: number) => Math.round(n * sy);
      const T = (n: number) => Math.max(10, Math.round(n * sText));

      // Function that maps each element spec to actual design elements from template
      for (const spec of template.elements) {
        if (spec.kind === "bg") {
          elements.push(
            rectShape({
              top: 0,
              left: 0,
              width: pageW,
              height: pageH,
              color: plan.palette.bg,
            })
          );
        }

        if (spec.kind === "accent_bar") {
          elements.push(
            rectShape({
              top: Y(spec.top),
              left: X(spec.left),
              width: X(spec.width),
              height: Y(spec.height),
              color: plan.palette.accent,
            })
          );
        }

        if (spec.kind === "headline") {
          elements.push({
            type: "text",
            children: [plan.copy.headline],
            top: Y(spec.top),
            left: X(spec.left),
            width: X(spec.width),
            fontSize: T(spec.fontSize),
            textAlign: "center",
            color: plan.palette.text,
          });
        }

        if (spec.kind === "subhead") {
          elements.push({
            type: "text",
            children: [plan.copy.subhead],
            top: Y(spec.top),
            left: X(spec.left),
            width: X(spec.width),
            fontSize: T(spec.fontSize),
            textAlign: "center",
            color: plan.palette.text,
          });
        }

        if (spec.kind === "cta_pill") {
          elements.push(
            rectShape({
              top: Y(spec.top),
              left: X(spec.left),
              width: X(spec.width),
              height: Y(spec.height),
              color: plan.palette.accent,
            })
          );
        }

        if (spec.kind === "cta_text") {
          elements.push({
            type: "text",
            children: [plan.copy.cta],
            top: Y(spec.top),
            left: X(spec.left),
            width: X(spec.width),
            fontSize: Y(spec.fontSize),
            textAlign: "center",
            originX: "center",
            color: "#000000",
            // Center-ish: you can later use text alignment properties if your SDK version supports it
          });
        }

        if (spec.kind === "footer") {
          elements.push({
            type: "text",
            children: [plan.copy.footer],
            top: Y(spec.top),
            left: X(spec.left),
            width: X(spec.width),
            fontSize: T(spec.fontSize),
            textAlign: "center",
            color: plan.palette.text,
          });
        }
      }

      // Finally, add the new page with all the elements
      await addPage({
        title: `Story — ${styleMode}`,
        elements,
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>Prompt → Story design (text-only)</Text>

        <TextInput
          placeholder="e.g., Announce our new hoodie drop this Friday at 7PM"
          value={prompt}
          onChange={(value) => setPrompt(value)}
        />

        <TextInput
          placeholder="Brand (optional) e.g., apexwear"
          value={brand}
          onChange={(value) => setBrand(value)}
        />

        <TextInput
          placeholder="CTA (optional) e.g., Shop now"
          value={cta}
          onChange={(value) => setCta(value)}
        />

        <Select
          value={styleMode}
          onChange={(value) => setStyleMode(value as StyleMode)}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "bold", label: "Bold" },
            { value: "premium", label: "Premium" },
          ]}
        />

        <Button
          variant="primary"
          onClick={onGenerate}
          disabled={!canAddPage || isGenerating}
          stretch
        >
          {isGenerating ? "Generating..." : "Generate Story"}
        </Button>

        {!canAddPage && (
          <Text>
            This design context doesn’t support adding pages. Try opening an Instagram Story design.
          </Text>
        )}
      </Rows>
    </div>
  );
};

export const DOCS_URL = "https://www.canva.dev/docs/apps";