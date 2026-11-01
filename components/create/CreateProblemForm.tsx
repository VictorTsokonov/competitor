"use client";

import { useEffect, useState } from "react";
import Field from "@/components/ui/Field";
import Pill from "@/components/ui/Pill";
import LatexEditor from "@/components/latex/LatexEditor";
import LatexPreview from "@/components/latex/LatexPreview";
import AttemptSection from "@/components/create/AttemptSection";
import PhotoDropzone from "@/components/create/PhotoDropzone";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import { filesToPages, MAX_ATTEMPT_PAGES, type PageImage } from "@/lib/pages";

const STATEMENT_PLACEHOLDER =
  "Prove that among any $n+1$ distinct integers chosen from $\\{1, 2, \\dots, 2n\\}$, there are two that are coprime.";

const MAX_STATEMENT_PAGES = 3;

// What the dashboard needs to create the problem and run the pipeline:
// the statement as typed text or as screenshot pages (transcribed as the
// pipeline's first stage), and optionally the attempt pages.
export type CreateRequest = {
  name?: string;
  writtenText?: string;
  statementPages: PageImage[];
  attemptPages: PageImage[];
  mode: "submit" | "later";
};

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
  onCreate,
  busy,
}: {
  onCreate: (req: CreateRequest) => void;
  busy: boolean;
}) {
  const [mode, setMode] = useState<"write" | "photo">("write");
  const [name, setName] = useState("");
  const [latex, setLatex] = useState("");
  const [photos, setPhotos] = useState<PageImage[]>([]);
  const [attemptPages, setAttemptPages] = useState<PageImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Pasted screenshots land in the problem field until it has a source,
  // then in the attempt; clicking a dropzone first targets that field.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      e.preventDefault();
      const focused = (document.activeElement as HTMLElement | null)
        ?.closest?.("[data-paste-target]")
        ?.getAttribute("data-paste-target");
      const hasStatement = latex.trim().length > 0 || photos.length > 0;
      const dest =
        focused === "problem" || focused === "attempt"
          ? focused
          : hasStatement
            ? "attempt"
            : "problem";
      void filesToPages(files).then(({ pages, errors }) => {
        if (pages.length > 0) {
          if (dest === "problem") {
            setMode("photo");
            setPhotos((prev) => [...prev, ...pages].slice(0, MAX_STATEMENT_PAGES));
          } else {
            setAttemptPages((prev) =>
              [...prev, ...pages].slice(0, MAX_ATTEMPT_PAGES)
            );
          }
        }
        setStatus(
          errors.length > 0
            ? errors.join(" ")
            : `Pasted into the ${dest === "problem" ? "problem" : "attempt"} field.`
        );
      });
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [latex, photos.length]);

  function create(createMode: "submit" | "later") {
    if (busy) return;
    const writtenText = latex.trim();
    if (mode === "write" && !writtenText) {
      setStatus(
        "Write the problem first — or switch to Photograph it and drop a screenshot."
      );
      return;
    }
    if (mode === "photo" && photos.length === 0) {
      setStatus("Drop a screenshot of the problem first.");
      return;
    }
    if (createMode === "submit" && attemptPages.length === 0) {
      setStatus(
        "Add at least one page of your attempt — or use “Create problem and solve later”."
      );
      return;
    }
    setStatus(null);
    onCreate({
      name: name.trim() || undefined,
      writtenText: mode === "write" ? writtenText : undefined,
      statementPages: mode === "photo" ? photos : [],
      attemptPages,
      mode: createMode,
    });
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-[3.5rem] font-bold leading-none">
        New problem
      </h1>
      <p className="mb-[26px] text-[1.1875rem] text-muted">
        Paste or write the statement — a screenshot is transcribed into LaTeX
        for you — and add your attempt now or later.
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
        <div className="mb-[30px]" data-paste-target="problem">
          <PhotoDropzone
            pages={photos}
            onPages={setPhotos}
            max={MAX_STATEMENT_PAGES}
            emptyLabel={
              <>
                Drop or paste a screenshot of the problem here, or{" "}
                <span className="underline">choose a file</span>
              </>
            }
          />
          {photos.length > 0 && (
            <PageThumbnails
              pages={photos}
              onRemove={(id) => setPhotos(photos.filter((p) => p.id !== id))}
            />
          )}
          <p className="mt-2 text-[0.9375rem] text-muted">
            It is transcribed into LaTeX when you create the problem; you can
            edit the statement afterwards if a symbol came out wrong.
          </p>
        </div>
      )}

      <div data-paste-target="attempt">
        <AttemptSection pages={attemptPages} onPages={setAttemptPages} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pill
          variant="primary"
          onClick={() => create("submit")}
          className="min-h-[42px] text-[1.0625rem]"
        >
          {busy ? "Working…" : "Create problem and submit solution"}
        </Pill>
        <Pill onClick={() => create("later")}>Create problem and solve later</Pill>
      </div>
      <p className="mt-3 text-[0.9375rem] text-muted">
        Analysis takes about a minute; each stage reports itself as it
        finishes.
      </p>
      {status && (
        <p role="status" className="mt-3 text-[1.0625rem] text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
