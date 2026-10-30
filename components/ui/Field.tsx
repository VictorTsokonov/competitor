export default function Field({
  id,
  value,
  onChange,
  placeholder,
  multiline,
  rows,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  ariaLabel?: string;
}) {
  const cls =
    "w-full rounded-[0.625rem] border-2 border-ink bg-card px-3.5 py-3 text-[1.125rem] text-ink shadow-[2px_3px_0_rgba(43,38,34,0.12)] placeholder:text-[var(--placeholder)]";
  if (multiline) {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 8}
        aria-label={ariaLabel}
        className={cls}
      />
    );
  }
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cls}
    />
  );
}
