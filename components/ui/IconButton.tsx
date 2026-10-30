export default function IconButton({
  label,
  onClick,
  size = "md",
  className,
  children,
}: {
  label: string;
  onClick?: () => void;
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  const dims = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-transparent text-ink hover:bg-ink/10 ${dims}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </button>
  );
}
