"use client";

import { useEffect, useRef, useState } from "react";
import Field from "@/components/ui/Field";
import Pill from "@/components/ui/Pill";
import LatexEditor from "@/components/latex/LatexEditor";
import LatexPreview from "@/components/latex/LatexPreview";
import AttemptSection from "@/components/create/AttemptSection";
import PhotoDropzone from "@/components/create/PhotoDropzone";
import PageThumbnails from "@/components/comparison/PageThumbnails";
import { pastedPageFiles } from "@/components/create/pastedFiles";
import { usePageDrop } from "@/components/create/usePageDrop";
import { MAX_ATTEMPT_PAGES, type PageImage } from "@/lib/pages";

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

// Never blocked: problems are analysed side by side, so the form stays
// usable while earlier ones are still running.
export default function CreateProblemForm({
  onCreate,
}: {
  onCreate: (req: CreateRequest) => void;
}) {
  const [mode, setMode] = useState<"write" | "photo">("write");
  const [name, setName] = useState("");
  const [latex, setLatex] = useState("");
  const [photos, setPhotos] = useState<PageImage[]>([]);
  const [attemptPages, setAttemptPages] = useState<PageImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  // Each field's drop, owned here so a paste routed to it shows the same
  // progress, page-limit note and errors as a drop on it.
  const problemDrop = usePageDrop(photos, setPhotos, MAX_STATEMENT_PAGES);
  const attemptDrop = usePageDrop(attemptPages, setAttemptPages, MAX_ATTEMPT_PAGES);

  // Pasted screenshots land in the problem field until the chosen way of
  // giving the statement (typed text, or screenshots) has one, then in the
  // attempt; clicking a dropzone first targets that field. This is the
  // form's only paste listener: its dropzones leave acceptPaste off, so each
  // paste lands in exactly one field. The listener calls the latest
  // onPaste, so it sees the current fields.
  function onPaste(e: ClipboardEvent) {
    const files = pastedPageFiles(e);
    if (files.length === 0) return;
    e.preventDefault();
    const focused = (document.activeElement as HTMLElement | null)
      ?.closest?.("[data-paste-target]")
      ?.getAttribute("data-paste-target");
    const hasStatement = mode === "write" ? latex.trim() !== "" : photos.length > 0;
    const dest =
      focused === "problem" || focused === "attempt"
        ? focused
        : hasStatement
          ? "attempt"
          : "problem";
    if (dest === "problem") setMode("photo");
    setStatus(null);
    void (dest === "problem" ? problemDrop : attemptDrop).add(files).then((added) => {
      if (added > 0) setStatus(`Pasted into the ${dest} field.`);
    });
  }
  const onPasteRef = useRef(onPaste);
  useEffect(() => {
    onPasteRef.current = onPaste;
  });
  useEffect(() => {
    const listener = (e: ClipboardEvent) => onPasteRef.current(e);
    window.addEventListener("paste", listener);
    return () => window.removeEventListener("paste", listener);
  }, []);

  function create(createMode: "submit" | "later") {
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
        Name{" "}
        <span className="font-normal text-muted">
          (optional — left empty, it is named from the statement)
        </span>
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
            drop={problemDrop}
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
        <AttemptSection pages={attemptPages} onPages={setAttemptPages} drop={attemptDrop} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pill
          variant="primary"
          onClick={() => create("submit")}
          className="min-h-[42px] text-[1.0625rem]"
        >
          Create problem and submit solution
        </Pill>
        <Pill onClick={() => create("later")}>Create problem and solve later</Pill>
      </div>
      <p className="mt-3 text-[0.9375rem] text-muted">
        A full analysis takes several minutes — usually 6 to 10. Each stage
        reports itself as it finishes, and you can create or open other
        problems meanwhile.
      </p>
      {status && (
        <p role="status" className="mt-3 text-[1.0625rem] text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
