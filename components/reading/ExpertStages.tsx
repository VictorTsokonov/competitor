import type { Chain } from "@/lib/schema";
import StageSection from "@/components/reading/StageSection";
import Reading from "@/components/reading/Reading";
import Goal from "@/components/reading/Goal";
import InformalCues from "@/components/reading/InformalCues";
import Abstraction from "@/components/reading/Abstraction";
import Simplification from "@/components/reading/Simplification";
import Method from "@/components/reading/Method";
import Prerequisites from "@/components/reading/Prerequisites";
import SecondReading from "@/components/reading/SecondReading";

// The eight stages of the expert reading, in protocol order.
export default function ExpertStages({ expert }: { expert: Chain }) {
  return (
    <>
      <StageSection index="1" title="Reading">
        <Reading reading={expert.reading} spans={expert.spans} />
      </StageSection>
      <StageSection index="2" title="Goal">
        <Goal goal={expert.goal} />
      </StageSection>
      <StageSection index="3" title="Informal cues">
        <InformalCues informal_cues={expert.informal_cues} spans={expert.spans} />
      </StageSection>
      <StageSection index="4" title="Abstraction">
        <Abstraction abstraction={expert.abstraction} />
      </StageSection>
      <StageSection index="5" title="Simplification">
        <Simplification simplification={expert.simplification} />
      </StageSection>
      <StageSection index="6" title="Method">
        <Method method={expert.method} spans={expert.spans} />
      </StageSection>
      <StageSection index="7" title="Prerequisites">
        <Prerequisites prerequisites={expert.prerequisites} />
      </StageSection>
      <StageSection index="8" title="Second reading">
        <SecondReading second_reading={expert.second_reading} spans={expert.spans} />
      </StageSection>
    </>
  );
}
