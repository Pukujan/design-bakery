import React from "react";
import { ExternalLink } from "lucide-react";
import decorOrbit from "../../assets/pukujan-decor-orbit.svg";
import {
  aiSystemLayers,
  narrativeCards,
  oniSystemLayers,
} from "./waterLoopsData";

function NarrativeParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="oni-text font-bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function NarrativeMediaCard({
  card,
  index,
}: {
  card: (typeof narrativeCards)[number];
  index: number;
}) {
  const reversed = index % 2 === 1;
  const fitContain = card.mediaFit === "contain";
  const bodyParagraphs = card.bodyParagraphs?.length ? card.bodyParagraphs : card.body ? [card.body] : [];

  return (
    <article className="oni-surface oni-border oni-shadow relative overflow-hidden rounded-[2rem] border shadow-sm">
      <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-20 -top-24 h-64 w-48 opacity-[0.07]" />
      <div className={`grid gap-0 lg:grid-cols-2 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative flex flex-col bg-slate-950">
          <div
            className={
              fitContain
                ? "flex min-h-[14rem] flex-1 items-center justify-center p-3 sm:min-h-[18rem] lg:min-h-[22rem]"
                : "relative min-h-[14rem] sm:min-h-[18rem] lg:min-h-[20rem]"
            }
          >
            <img
              src={card.mediaSrc}
              alt={card.mediaAlt}
              className={
                fitContain
                  ? "max-h-[min(32rem,70vh)] w-full object-contain object-center"
                  : "h-56 w-full object-cover sm:h-72 lg:absolute lg:inset-0 lg:h-full lg:object-cover"
              }
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/95 px-4 py-3 text-xs">
            <span className="font-bold text-slate-400">{card.sourceLabel}</span>
            <a
              href={card.sourceHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-cyan-200 hover:text-white"
            >
              View media <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">
            {String(index + 1).padStart(2, "0")} / narrative
          </p>
          <h3 className="oni-text mt-3 text-2xl font-black tracking-tight md:text-3xl">{card.title}</h3>
          <div className="oni-text-muted mt-4 space-y-4 leading-7">
            {bodyParagraphs.map((paragraph, pIndex) => (
              <NarrativeParagraph key={`${card.id}-p-${pIndex}`} text={paragraph} />
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <p className="oni-surface-muted rounded-2xl p-4 text-sm leading-6">
              <span className="oni-text-subtle block text-xs font-black uppercase tracking-[0.2em]">ONI</span>
              <span className="oni-text mt-1 block font-semibold">{card.oniCaption}</span>
            </p>
            <p className="oni-accent-soft oni-border rounded-2xl border p-4 text-sm leading-6">
              <span className="oni-eyebrow block text-xs font-black uppercase tracking-[0.2em]">AI agents</span>
              <span className="oni-text mt-1 block font-semibold">{card.aiCaption}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WaterLoopsNarrativeSection() {
  return (
    <section id="waterLoops" className="oni-border-t scroll-mt-36 md:scroll-mt-40 border-t py-20">
      <div className="mb-10">
        <p className="oni-eyebrow mb-3 text-xs font-bold uppercase tracking-[0.35em]">03 / water loops</p>
        <h2 className="oni-text max-w-5xl text-3xl font-black tracking-tight md:text-5xl">
          From Water Loops to Multi-Agent Pipelines
        </h2>
        <p className="oni-text-muted mt-4 max-w-3xl text-lg font-semibold leading-8">
          How ONI taught me to think about flow, failure, automation, and controlled systems.
        </p>
        <p className="oni-text-muted mt-6 max-w-4xl text-lg leading-8">
          This is only one ONI system. A water loop is just one piece of the game. To build a sustainable colony, you also have to think about heat, cooling, power, gas flow, food management, resources, infrastructure, manpower, automation, and long-term failure points.
        </p>
        <p className="oni-text-muted mt-4 max-w-4xl text-lg leading-8">
          That is exactly how AI agent systems work too. One pipeline is not enough. You also need prompt control, evals, file routing, logs, review gates, cost control, model behavior, human judgment, rollback paths, and architecture boundaries.
        </p>
      </div>

      <div className="grid gap-8">
        {narrativeCards.map((card, index) => (
          <NarrativeMediaCard key={card.id} card={card} index={index} />
        ))}
      </div>

      <div className="oni-surface oni-border oni-shadow mt-14 rounded-[2rem] border p-6 md:p-8">
        <h3 className="oni-text text-2xl font-black tracking-tight md:text-3xl">One ONI system is never just one system</h3>
        <p className="oni-text-muted mt-4 max-w-3xl leading-7">
          A water loop is only one layer of ONI. A prompt pipeline is only one layer of AI engineering. The real challenge is making all the layers work together without collapsing.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="oni-surface-muted rounded-3xl p-6">
            <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.25em]">ONI systems</p>
            <ul className="oni-text mt-4 grid gap-2 sm:grid-cols-2">
              {oniSystemLayers.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="oni-accent-soft oni-border rounded-3xl border p-6">
            <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.25em]">AI agent systems</p>
            <ul className="oni-text mt-4 grid gap-2 sm:grid-cols-2">
              {aiSystemLayers.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
