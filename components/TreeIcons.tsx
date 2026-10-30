function Icon({ d, label }: { d: string; label: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

export function PlusIcon() {
  return <Icon d="M8 3v10M3 8h10" label="Add" />;
}

export function PencilIcon() {
  return <Icon d="M11.5 2.5l2 2L5 13H3v-2z" label="Rename" />;
}

export function TrashIcon() {
  return <Icon d="M3 4.5h10M6.5 4V2.5h3V4M5 4.5l.7 9h4.6l.7-9" label="Delete" />;
}

export function FolderIcon() {
  return (
    <Icon
      d="M1.5 4.5c0-.8.7-1.5 1.5-1.5h3l1.5 2h6c.8 0 1.5.7 1.5 1.5v5c0 .8-.7 1.5-1.5 1.5H3c-.8 0-1.5-.7-1.5-1.5v-7z"
      label="Folder"
    />
  );
}

export function FileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      role="img"
      aria-label="Problem"
      className="shrink-0"
    >
      <path d="M4 1.5h5.5L13 5v9.5H4z" />
      <path d="M9.5 1.5V5H13" />
    </svg>
  );
}
