"use client";

import { useState } from "react";
import { RichTex } from "@/components/StageCard";
import { findLatexErrors } from "@/lib/latex";
import {
  createProblem,
  loadLibrary,
  saveLibrary,
} from "@/lib/problems";

export default function CreateProblemForm({
  onSaved,
}: {
  onSaved: (id: string) => void;
}) {
  const [mode, setMode] = useState<"write" | "photo">("write");
  const [name, setName] = useState("");
  const [latex, setLatex] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const errors = latex.trim() ? findLatexErrors(latex) : [];

  function save() {
    if (!latex.trim()) {
      setStatus("Write the problem first — there is nothing to save yet.");
      return;
    }
    const fresh = loadLibrary(localStorage);
    const created = createProblem(fresh, {
      name: name.trim() || undefined,
      latex: latex.trim(),
    });
    saveLibrary(localStorage, created.state);
    setStatus(null);
    onSaved(created.problem.id);
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
  }

  return (
    <div>
      <div className="mt-4 flex gap-2" role="tablist" aria-label="Creation method">
        {(["write", "photo"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              mode === m ? "bg-accent text-white" : "bg-surface"
            }`}
          >
            {m === "write" ? "Write it" : "Screenshot it"}
          </button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold">Name (optional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pigeonhole warm-up"
          className="mt-1 w-full rounded-[16px] border border-line bg-background px-4 py-2"
        />
      </label>

      {mode === "write" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">LaTeX source</span>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              rows={10}
              placeholder="\text{Among } n+1 \text{ integers, two differ by a multiple of } n."
              className="mt-1 w-full rounded-[16px] border border-line bg-background px-4 py-2 font-mono text-sm"
            />
          </label>
          <div>
            <p className="text-sm font-semibold">Preview</p>
            <div className="mt-1 min-h-[248px] rounded-[16px] border border-line px-4 py-2 leading-[1.6]">
              {latex.trim() ? (
                <RichTex tex={latex} />
              ) : (
                <span className="text-muted">Nothing to preview yet.</span>
              )}
            </div>
            {errors.length > 0 && (
              <p role="alert" className="mt-2 text-sm text-muted">
                LaTeX note: {errors[0]}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-line p-4">
          <label className="block">
            <span className="text-sm font-semibold">Problem screenshot</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPhoto(e.target.files?.[0])}
              className="mt-1 block w-full text-sm"
            />
          </label>
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Uploaded problem screenshot"
              className="mt-3 max-h-64 rounded-[16px]"
            />
          )}
          <p className="mt-3 text-sm text-muted">
            Automatic reading isn&apos;t wired yet — type the problem
            above in Write mode to save it. The photo stays on this page
            only.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-full bg-accent px-6 py-3 font-semibold text-white"
        >
          Save problem
        </button>
        {status && <p role="status" className="text-sm text-muted">{status}</p>}
      </div>
    </div>
  );
}
