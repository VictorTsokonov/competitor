// Local-first problem library. No auth, no DB: one localStorage key.
// Shapes keep a userId-shaped hole so post-submit auth slots in later.

export type ProblemFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type StoredProblem = {
  id: string;
  name: string;
  latex: string;
  folderId: string | null;
  createdAt: number;
};

export type LibraryState = {
  problems: StoredProblem[];
  folders: ProblemFolder[];
};

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const LIBRARY_KEY = "competitor.problems.v1";
export const SELECT_INTENT_KEY = "competitor.selected-problem";

const EMPTY: LibraryState = { problems: [], folders: [] };

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function loadLibrary(storage: KeyValueStorage): LibraryState {
  try {
    const raw = storage.getItem(LIBRARY_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    if (!Array.isArray(parsed.problems) || !Array.isArray(parsed.folders)) {
      return { ...EMPTY };
    }
    const folders = parsed.folders.filter(
      (f) => f && typeof f.id === "string" && typeof f.name === "string"
    );
    const ids = new Set(folders.map((f) => f.id));
    return {
      problems: parsed.problems.filter(
        (p) =>
          p && typeof p.id === "string" && typeof p.name === "string" && typeof p.latex === "string"
      ),
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        parentId:
          typeof f.parentId === "string" && ids.has(f.parentId) ? f.parentId : null,
      })),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveLibrary(storage: KeyValueStorage, state: LibraryState): void {
  try {
    storage.setItem(LIBRARY_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: library lives for this session only */
  }
}

export function nextAutoName(state: LibraryState): string {
  return `Problem ${state.problems.length + 1}`;
}

export function createProblem(
  state: LibraryState,
  input: { name?: string; latex: string; folderId?: string | null }
): { state: LibraryState; problem: StoredProblem } {
  const problem: StoredProblem = {
    id: uid(),
    name: input.name?.trim() || nextAutoName(state),
    latex: input.latex,
    folderId: input.folderId ?? null,
    createdAt: Date.now(),
  };
  return { state: { ...state, problems: [...state.problems, problem] }, problem };
}

export function renameProblem(
  state: LibraryState,
  id: string,
  name: string
): LibraryState {
  const clean = name.trim();
  if (!clean) return state;
  return {
    ...state,
    problems: state.problems.map((p) => (p.id === id ? { ...p, name: clean } : p)),
  };
}

export function moveProblem(
  state: LibraryState,
  id: string,
  folderId: string | null
): LibraryState {
  if (folderId !== null && !state.folders.some((f) => f.id === folderId)) {
    return state;
  }
  return {
    ...state,
    problems: state.problems.map((p) => (p.id === id ? { ...p, folderId } : p)),
  };
}

export function createFolder(
  state: LibraryState,
  name: string,
  parentId: string | null = null
): { state: LibraryState; folder: ProblemFolder } {
  const folder: ProblemFolder = {
    id: uid(),
    name: name.trim() || "Untitled folder",
    parentId: parentId !== null && state.folders.some((f) => f.id === parentId) ? parentId : null,
  };
  return { state: { ...state, folders: [...state.folders, folder] }, folder };
}

// All nested folder ids under id, not including id itself.
export function descendants(state: LibraryState, id: string): string[] {
  const out: string[] = [];
  const queue = state.folders.filter((f) => f.parentId === id).map((f) => f.id);
  while (queue.length > 0) {
    const current = queue.shift() as string;
    out.push(current);
    for (const f of state.folders.filter((f) => f.parentId === current)) {
      queue.push(f.id);
    }
  }
  return out;
}

// Rejected (state returned unchanged): self-drop, drop into a descendant,
// or a missing target. Root (null) is always legal.
export function moveFolder(
  state: LibraryState,
  id: string,
  parentId: string | null
): LibraryState {
  if (parentId === id) return state;
  if (parentId !== null) {
    if (!state.folders.some((f) => f.id === parentId)) return state;
    if (descendants(state, id).includes(parentId)) return state;
  }
  if (!state.folders.some((f) => f.id === id)) return state;
  return {
    ...state,
    folders: state.folders.map((f) => (f.id === id ? { ...f, parentId } : f)),
  };
}

export function renameFolder(
  state: LibraryState,
  id: string,
  name: string
): LibraryState {
  const clean = name.trim();
  if (!clean) return state;
  return {
    ...state,
    folders: state.folders.map((f) => (f.id === id ? { ...f, name: clean } : f)),
  };
}

// Deepest folder nesting level (root folders sit at 0). Cycle-safe.
export function maxFolderDepth(folders: ProblemFolder[]): number {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let max = 0;
  for (const f of folders) {
    let depth = 0;
    let cur = f;
    const seen = new Set<string>();
    while (cur.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
      seen.add(cur.parentId);
      depth++;
      cur = byId.get(cur.parentId) as ProblemFolder;
    }
    max = Math.max(max, depth);
  }
  return max;
}

export function deleteFolder(state: LibraryState, id: string): LibraryState {
  const target = state.folders.find((f) => f.id === id);
  if (!target) return state;
  return {
    folders: state.folders
      .filter((f) => f.id !== id)
      .map((f) => (f.parentId === id ? { ...f, parentId: target.parentId } : f)),
    problems: state.problems.map((p) =>
      p.folderId === id ? { ...p, folderId: null } : p
    ),
  };
}
