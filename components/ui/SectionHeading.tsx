export default function SectionHeading({
  index,
  title,
  source,
}: {
  index: string;
  title: string;
  source?: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-display text-[2rem] font-bold leading-none max-[60rem]:text-[1.75rem]">
        {index} · {title}
      </div>
      {source && (
        <div className="mt-1 text-[0.9375rem] italic text-muted">{source}</div>
      )}
    </div>
  );
}
