// Names a new problem without the user's help: the placeholder becomes a
// provisional name from the statement's opening words, then the short
// title the model writes (POST /api/title). Only automatic names are ever
// replaced; a name the user typed or a rename made meanwhile wins. Each
// load -> modify -> save runs with no await in between, so a concurrent
// edit elsewhere in the library is never overwritten. Never throws: a
// failed title call (or demo mode's 403) keeps the provisional name.

import { postJson } from "./postJson";
import {
  loadLibrary,
  PLACEHOLDER_NAME,
  provisionalName,
  renameProblem,
  saveLibrary,
  type KeyValueStorage,
} from "./problems";

function libraryChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("competitor:library-changed"));
  }
}

// Renames the problem when its current name is one of `from`; false when
// it is gone or the user has named it.
function renameIf(
  storage: KeyValueStorage,
  problemId: string,
  from: string[],
  to: string
): boolean {
  const library = loadLibrary(storage);
  const problem = library.problems.find((p) => p.id === problemId);
  if (!problem || !from.includes(problem.name)) return false;
  if (problem.name !== to) {
    saveLibrary(storage, renameProblem(library, problemId, to));
    libraryChanged();
  }
  return true;
}

export async function autoNameProblem(
  storage: KeyValueStorage,
  problemId: string,
  statement: string
): Promise<void> {
  try {
    const provisional = provisionalName(statement);
    if (!renameIf(storage, problemId, [PLACEHOLDER_NAME, provisional], provisional)) return;
    if (!statement.trim()) return;

    const { title } = await postJson<{ title?: unknown }>("/api/title", {
      problemText: statement,
    });
    if (typeof title !== "string" || !title.trim()) return;
    renameIf(storage, problemId, [provisional], title.trim());
  } catch {
    /* no title: the provisional name stays */
  }
}
