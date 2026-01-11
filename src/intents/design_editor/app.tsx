import { useMemo, useState } from "react";
import { useFeatureSupport } from "@canva/app-hooks";
import { Button, Rows, Text, TextInput, Select } from "@canva/app-ui-kit";
import { addPage } from "@canva/design";
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

const DEFAULT_PALETTES: Record<StyleMode, { bg: string; text: string; accent: string }> = {
  minimal: { bg: "#0B0F1A", text: "#FFFFFF", accent: "#22C55E" },
  bold: { bg: "#0B0F1A", text: "#FFFFFF", accent: "#7C3AED" },
  premium: { bg: "#0A0A0A", text: "#F5F5F5", accent: "#C8A04D" },
};

// --- TEMP: local “fake LLM” so you can test rendering immediately.
// Replace this with a backend call next.
function fakePlanner(prompt: string, mode: StyleMode, brand?: string, cta?: string): StoryPlan {
  const b = brand?.trim() || "yourbrand";
  const clean = prompt.trim() || "New product drop";

  const template_id =
    mode === "minimal" ? "t_min_01" : mode === "bold" ? "t_bold_01" : "t_prem_01";

  return {
    style_mode: mode,
    template_id,
    palette: DEFAULT_PALETTES[mode],
    copy: {
      headline: clean.toUpperCase(),
      subhead: "Limited stock. Set a reminder and don’t miss it.",
      cta: cta?.trim() || "Shop now",
      footer: `@${b} • This week`,
    },
  };
}

export const App = () => {
  const intl = useIntl();
  const isSupported = useFeatureSupport();

  const [prompt, setPrompt] = useState("");
  const [styleMode, setStyleMode] = useState<StyleMode>("minimal");
  const [brand, setBrand] = useState("");
  const [cta, setCta] = useState("");

  const canAddPage = isSupported(addPage);

  const onGenerate = async () => {
    if (!canAddPage) return;

    // Replace fakePlanner with your backend LLM call later
    const rawPlan = fakePlanner(prompt, styleMode, brand, cta);
    const plan = normalizePlan(rawPlan);
    const template = getTemplate(plan.template_id);

    const elements: any[] = [];

    for (const spec of template.elements) {
      if (spec.kind === "bg") {
        elements.push(
          rectShape({
            top: 0,
            left: 0,
            width: STORY_W,
            height: STORY_H,
            color: plan.palette.bg,
          })
        );
      }

      if (spec.kind === "accent_bar") {
        elements.push({
          type: "shape",
          shape: "rectangle",
          top: spec.top,
          left: spec.left,
          width: spec.width,
          height: spec.height,
          cornerRadius: spec.radius ?? 0,
          fill: { color: plan.palette.accent },
        });
      }

      if (spec.kind === "headline") {
        elements.push({
          type: "text",
          children: [plan.copy.headline],
          top: spec.top,
          left: spec.left,
          width: spec.width,
          fontSize: spec.fontSize,
          color: plan.palette.text,
        });
      }

      if (spec.kind === "subhead") {
        elements.push({
          type: "text",
          children: [plan.copy.subhead],
          top: spec.top,
          left: spec.left,
          width: spec.width,
          fontSize: spec.fontSize,
          color: plan.palette.text,
        });
      }

      if (spec.kind === "cta_pill") {
        elements.push(
          rectShape({
            top: spec.top,
            left: spec.left,
            width: spec.width,
            height: spec.height,
            color: plan.palette.accent,
          })
        );
      }

      if (spec.kind === "cta_text") {
        elements.push({
          type: "text",
          children: [plan.copy.cta],
          top: spec.top,
          left: spec.left,
          width: spec.width,
          fontSize: spec.fontSize,
          color: "#000000",
          // Center-ish: you can later use text alignment properties if your SDK version supports it
        });
      }

      if (spec.kind === "footer") {
        elements.push({
          type: "text",
          children: [plan.copy.footer],
          top: spec.top,
          left: spec.left,
          width: spec.width,
          fontSize: spec.fontSize,
          color: plan.palette.text,
        });
      }
    }

    await addPage({
      title: `Story — ${styleMode}`,
      elements,
    });
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
          disabled={!canAddPage}
          stretch
        >
          Generate Story
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
