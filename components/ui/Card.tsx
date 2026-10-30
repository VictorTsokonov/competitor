export default function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-card px-4 py-3.5 text-[1rem] leading-[1.5] shadow-[2px_3px_0_rgba(43,38,34,0.12)]${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </div>
  );
}
