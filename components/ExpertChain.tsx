import type { Chain } from "@/lib/schema";
import StageCard, { Tex } from "@/components/StageCard";

export default function ExpertChain({ expert }: { expert: Chain }) {
  return (
    <>
      <StageCard title="Weighted reading">
        {expert.problem_spans.map((s) => (
          <p key={s.text}>
            <span className="mr-2 inline-block min-w-6 rounded bg-accent px-1 text-center text-sm font-semibold text-white">
              {s.weight}
            </span>
            <span className="font-mono text-sm">{s.text}</span>
            <span className="text-sm"> — {s.reason}</span>
          </p>
        ))}
      </StageCard>

      <StageCard title="Cues">
        {expert.cues.map((c) => (
          <div key={c.id} className="rounded-[16px] bg-background p-3">
            <p className="text-sm">
              <span className="font-semibold">{c.id}</span>{" "}
              <span className="font-mono">“{c.span}”</span>{" "}
              <span className="hm-1 text-xs">{c.type}</span>
            </p>
            <p className="mt-1 text-sm">{c.why_it_matters}</p>
            <p className="text-sm text-muted">{c.how_spotted}</p>
          </div>
        ))}
      </StageCard>

      <StageCard title="Relations">
        {expert.relations.map((r, i) => (
          <div key={i} className="rounded-[16px] bg-background p-3">
            <p className="text-sm">{r.statement}</p>
            <p className="mt-1">
              <Tex tex={r.maths} />
            </p>
          </div>
        ))}
      </StageCard>

      <StageCard title="Model">
        {expert.model.objects.map((o, i) => (
          <p key={i}>
            <Tex tex={o} />
          </p>
        ))}
        {expert.model.definitions.map((d, i) => (
          <p key={i}>
            <Tex tex={d} />
          </p>
        ))}
        <p>
          <Tex tex={expert.model.formal_statement} />
        </p>
      </StageCard>

      <StageCard title="Selection">
        <p className="text-sm font-semibold">{expert.selection.method}</p>
        <p className="text-sm">
          Deciding cues: {expert.selection.deciding_cue_ids.join(", ")}
        </p>
        {expert.selection.rejected.map((r) => (
          <p key={r.method} className="text-sm">
            Dropped {r.method}: {r.why}
          </p>
        ))}
        <p className="text-sm italic">{expert.selection.unlocking_observation}</p>
      </StageCard>

      <StageCard title="Second reading">
        <p className="text-sm">{expert.pass_2.what_changed}</p>
      </StageCard>
    </>
  );
}
