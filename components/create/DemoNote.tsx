import { DEMO_MESSAGE } from "@/lib/mode";

const README_URL = "https://github.com/VictorTsokonov/competitor#readme";

// Demo mode's stand-in for creating a problem: the deploy serves recorded
// runs only, so this says how to run your own instead.
export default function DemoNote() {
  return (
    <div className="rounded-[0.625rem] border-2 border-dashed border-rule bg-card/60 p-4 text-[1.0625rem]">
      <p className="m-0">{DEMO_MESSAGE}</p>
      <p className="mb-0 mt-2">
        <a href={README_URL} className="underline">
          How to run it with your own key (README)
        </a>
      </p>
    </div>
  );
}
