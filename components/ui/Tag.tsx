export default function Tag({
  on,
  children,
}: {
  on?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-lg border-2 px-2.5 py-px text-[0.875rem] ${
        on ? "border-accent bg-accent text-cream" : "border-ink text-ink"
      }`}
    >
      {children}
    </span>
  );
}
