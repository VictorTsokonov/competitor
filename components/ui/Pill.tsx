const HAND_CUT = "rounded-[255px_15px_225px_15px/15px_225px_15px_255px]";

function pillClass(variant: "primary" | "secondary", extra?: string): string {
  const base = `inline-flex cursor-pointer items-center justify-center border-2 font-bold no-underline ${HAND_CUT}`;
  const skin =
    variant === "primary"
      ? "border-accent bg-accent text-cream"
      : "border-ink bg-transparent text-ink";
  return `${base} ${skin}${extra ? ` ${extra}` : ""}`;
}

export default function Pill({
  variant = "secondary",
  href,
  onClick,
  type,
  className,
  children,
}: {
  variant?: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
}) {
  // Mockup default: min-height 3.25rem, 1.25rem type; callers shrink via className.
  const cls = pillClass(variant, `min-h-[3.25rem] px-7 text-[1.25rem]${className ? ` ${className}` : ""}`);
  if (href !== undefined) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
