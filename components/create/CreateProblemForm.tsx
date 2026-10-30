"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import Pill from "@/components/ui/Pill";
import LatexEditor from "@/components/latex/LatexEditor";
import LatexPreview from "@/components/latex/LatexPreview";
import AttemptSection from "@/components/create/AttemptSection";
import PhotoDropzone, { type DroppedPhoto } from "@/components/create/PhotoDropzone";
import {
  createProblem,
  loadLibrary,
  saveLibrary,
} from "@/lib/problems";

const STATEMENT_PLACEHOLDER =
  "Prove that among any $n+1$ distinct integers chosen from $\\{1, 2, \\dots, 2n\\}$, there are two that are coprime.";

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{ width: "1rem", height: "1rem" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function CreateProblemForm({
  onSaved,
}: {
  onSaved: (id: string) => void;
}) {
  const [mode, setMode] = useState<"write" | "photo">("write");
  const [name, setName] = useState("");
  const [latex, setLatex] = useState("");
  const [photos, setPhotos] = useState<DroppedPhoto[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  function persist(): string | null {
    if (!latex.trim()) {
      setStatus("Write the problem first — there is nothing to save yet.");
      return null;
    }
    const fresh = loadLibrary(localStorage);
    const created = createProblem(fresh, {
      name: name.trim() || undefined,
      latex: latex.trim(),
    });
    saveLibrary(localStorage, created.state);
    setStatus(null);
    return created.problem.id;
  }

  function saveAndAnalyse() {
    const id = persist();
    if (id) onSaved(id);
  }

  function saveForLater() {
    const id = persist();
    if (id) setStatus("Saved to Sets — find it in the left panel.");
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-[3.5rem] font-bold leading-none">
        New problem
      </h1>
      <p className="mb-[26px] text-[1.1875rem] text-muted">
        Paste the statement, or photograph it and we transcribe it into LaTeX.
      </p>

      <div className="mb-[26px] flex flex-wrap gap-[10px]" role="group" aria-label="Creation method">
        <Pill
          variant={mode === "write" ? "primary" : "secondary"}
          onClick={() => setMode("write")}
          pressed={mode === "write"}
          className="min-h-[42px] text-[1.0625rem]"
        >
          Write it
        </Pill>
        <Pill
          variant={mode === "photo" ? "primary" : "secondary"}
          onClick={() => setMode("photo")}
          pressed={mode === "photo"}
          className="min-h-[42px] gap-2 text-[1.0625rem]"
        >
          <CameraIcon /> Photograph it
        </Pill>
      </div>

      <label
        htmlFor="pname"
        className="mb-[6px] block text-[1.0625rem] font-bold"
      >
        Name <span className="font-normal text-muted">(optional)</span>
      </label>
      <div className="mb-[22px]">
        <Field
          id="pname"
          value={name}
          onChange={setName}
          placeholder="e.g. Pigeonhole warm-up"
        />
      </div>

      {mode === "write" ? (
        <div>
          <div className="grid grid-cols-2 gap-[18px] max-[60rem]:grid-cols-1">
            <div>
              <label
                htmlFor="src"
                className="mb-[6px] block text-[1.0625rem] font-bold"
              >
                Statement
              </label>
              <LatexEditor
                id="src"
                value={latex}
                onChange={setLatex}
                rows={8}
                placeholder={STATEMENT_PLACEHOLDER}
              />
            </div>
            <div>
              <div className="mb-[6px] text-[1.0625rem] font-bold">Preview</div>
              <LatexPreview
                tex={latex}
                emptyText="Prose and inline $…$ maths render here as you type."
                minHeight="222px"
              />
            </div>
          </div>
          <p className="mb-[30px] mt-2 text-[0.9375rem] text-muted">
            Plain text with $…$ for maths. The button on the right opens the
            LaTeX reference.
          </p>
        </div>
      ) : (
        <div className="mb-[30px]">
          <PhotoDropzone
            photos={photos}
            onPhotos={setPhotos}
            max={1}
            emptyLabel={
              <>
                Drop a photo of the problem here, or{" "}
                <span className="underline">choose a file</span>
              </>
            }
          />
          <p className="mt-2 text-[0.9375rem] text-muted">
            Automatic reading isn’t wired yet — type the problem in Write
            mode to save it. The photo stays on this page only.
          </p>
        </div>
      )}

      <AttemptSection />

      <div className="flex flex-wrap items-center gap-3">
        <Pill variant="primary" onClick={saveAndAnalyse}>
          Save and analyse
        </Pill>
        <Pill onClick={saveForLater}>Save for later</Pill>
        <span className="ml-auto text-[0.9375rem] text-muted">
          Analysis takes about a minute. Stages appear as they finish.
        </span>
      </div>
      {status && (
        <p role="status" className="mt-3 text-[1.0625rem] text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
