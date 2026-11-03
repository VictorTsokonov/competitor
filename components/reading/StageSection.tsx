import SectionHeading from "@/components/ui/SectionHeading";

export default function StageSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-[22px] mt-10 border-t-2 border-dashed border-rule" />
      <SectionHeading index={index} title={title} />
      {children}
    </section>
  );
}
