export default function RailMark({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded border border-line px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
    >
      {label}
    </span>
  );
}
