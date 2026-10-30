import type { SpanCategory } from "@/lib/schema";

// Matches the mockups: .hi appears exactly on rule/goal spans at weight 80+.
const HI_AT = 80;

const TINTS: Record<SpanCategory, string> = {
  setting: "bg-cat-setting",
  definition: "bg-cat-definition",
  rule: "bg-cat-rule",
  goal: "bg-cat-goal",
  informal: "bg-cat-informal",
};

export default function Highlight({
  category,
  weight,
  you,
  unsure,
  children,
}: {
  category: SpanCategory;
  weight: number;
  you?: boolean;
  unsure?: boolean;
  children: React.ReactNode;
}) {
  const hi =
    weight >= HI_AT && (category === "rule" || category === "goal")
      ? category === "rule"
        ? "bg-cat-rule-hi"
        : "bg-cat-goal-hi"
      : TINTS[category];
  const mark = unsure
    ? "border-b-[3px] border-dashed border-accent"
    : you
      ? "border-b-[3px] border-accent"
      : "";
  return (
    <span className={`rounded-[3px] px-[3px] ${hi}${mark ? ` ${mark}` : ""}`}>
      {children}
    </span>
  );
}
