import SectionHeading from "@/components/ui/SectionHeading";
import { STAGE_SOURCES } from "@/lib/stage-sources";

export default function StageSection({
  index,
  title,
  sourceKey,
  children,
}: {
  index: string;
  title: string;
  sourceKey?: string;
  children: React.ReactNode;
}) {
  const source = sourceKey ? STAGE_SOURCES[sourceKey] : undefined;
  return (
    <section>
      <div className="mb-[22px] mt-10 border-t-2 border-dashed border-rule" />
      <SectionHeading
        index={index}
        title={title}
        source={
          source && (
            <>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {source.cite}
                </a>
              ) : (
                source.cite
              )}
              . {source.note}
            </>
          )
        }
      />
      {children}
    </section>
  );
}
