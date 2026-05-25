import React from "react";
import { ArrowDown } from "lucide-react";
import { agentPipelineFlow } from "./waterLoopsData";

export function PipelineFlowDiagram() {
  return (
    <>
      <div className="scrollbar-hide hidden gap-2 overflow-x-auto pb-2 md:flex md:items-center">
        {agentPipelineFlow.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active shrink-0 rounded-2xl border px-3 py-3 text-center text-xs font-bold whitespace-nowrap">
              {step}
            </div>
            {index < agentPipelineFlow.length - 1 ? (
              <span className="oni-text-subtle shrink-0 text-lg font-black" aria-hidden>
                →
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <div className="grid gap-2 md:hidden">
        {agentPipelineFlow.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active rounded-2xl border px-4 py-3 text-center text-sm font-bold">{step}</div>
            {index < agentPipelineFlow.length - 1 ? (
              <ArrowDown className="oni-text-subtle mx-auto h-5 w-5" aria-hidden />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
