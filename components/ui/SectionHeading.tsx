export default function SectionHeading({
  index,
  title,
}: {
  index: string;
  title: string;
}) {
  return (
    <div className="font-display text-[2rem] font-bold leading-none max-[60rem]:text-[1.75rem]">
      {index} · {title}
    </div>
  );
}
