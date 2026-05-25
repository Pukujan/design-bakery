import React from "react";
import { Section } from "@/app/components/investai/Section";
import { MVPArchitecture, FutureArchitecture } from "@/app/components/investai/Diagrams";
import {
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Activity,
  Search,
  Globe,
  Award,
  GitBranch,
  Database,
  Brain
} from "lucide-react";

export function ProductDesignCaseStudy() {
  return (
    <>
      {/* Section 1: Research Motivation */}
      <Section id="motivation" title="Research Motivation & Problem Framing">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Retail investors often rely on opaque "buy/sell" signals, social media sentiment,
              and static courses that are disconnected from real market dynamics.
              Existing tools focus heavily on <span className="font-semibold">prediction</span>,
              often neglecting the crucial skill of <span className="font-semibold">reasoning</span>.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              There is currently no scalable way to:
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Test investment theories safely without financial risk",
                "Measure the quality of financial reasoning objectively",
                "Compare analytical credibility across individuals or AI models"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <div className="mt-1.5 min-w-1.5 min-h-1.5 rounded-full bg-blue-600"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 p-8 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                <Search size={16} />
              </div>
              My Role
            </h3>
            <ul className="space-y-4">
              <li className="text-sm text-gray-600 border-l-2 border-gray-200 pl-4 py-1">
                Identified the gap between financial theory education and real-world application
              </li>
              <li className="text-sm text-gray-600 border-l-2 border-gray-200 pl-4 py-1">
                Framed the problem as a learning and credibility measurement challenge, not a trading problem
              </li>
              <li className="text-sm text-gray-600 border-l-2 border-gray-200 pl-4 py-1">
                Defined constraints to avoid real-money risk, regulatory exposure, and misleading predictive claims
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Section 2: Hypothesis */}
      <Section id="hypothesis" className="bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-sm font-bold tracking-wider uppercase text-blue-600 mb-6 block">Core Research Hypothesis</span>
          <blockquote className="text-2xl md:text-3xl font-serif text-gray-900 leading-normal mb-10">
            "Financial reasoning and credibility can be evaluated more reliably through repeatable paper trading experiments,
            contextual AI explanations, and behavioral consistency, rather than through isolated predictions or short-term gains."
          </blockquote>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { label: "Reasoning Quality", icon: Lightbulb },
              { label: "Risk Awareness", icon: ShieldAlert },
              { label: "Consistency Over Time", icon: Activity }
            ].map((metric) => (
              <div key={metric.label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 shadow-sm">
                  <metric.icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 3: Working MVP */}
      <Section id="mvp" title="Working MVP" subtitle="Current Status">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <p className="text-gray-600">
              The platform is currently fully functional, demonstrating the core loop of research, analysis, and paper trading.
            </p>

            <div className="space-y-4">
              {[
                "AI-assisted market sentiment analysis",
                "News-based sentiment variables",
                "Defined AI orchestration for specific analytical tasks",
                "Paper trading incentives focused on learning",
                "Stored AI outputs for reuse and cost control"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                  <span className="text-gray-800">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="https://financial-investment-with-gemini-in.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Try the MVP
              </a>
              <a
                href="https://github.com/Pukujan/financial-investment-with-gemini-insights"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Source Code
              </a>
            </div>
          </div>

          <div className="relative">
            {/* Simplified UI Representation */}
            <div className="aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
              <div className="absolute top-4 left-4 right-4 h-8 bg-gray-800 rounded flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div className="absolute top-16 left-4 right-4 bottom-4 bg-gray-800/50 rounded border border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                <TrendingUp className="text-blue-500 w-16 h-16 mb-4 opacity-80" />
                <h4 className="text-white font-bold text-lg">Live Market Dashboard</h4>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">Real-time sentiment analysis and paper trading interface.</p>
                <div className="mt-6 px-4 py-2 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                  Interactive Demo Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 4: Architecture */}
      <Section id="architecture" title="Technical Architecture" subtitle="MVP Phase">
        <p className="text-gray-600 max-w-2xl mb-12">
          The initial architecture prioritized rapid iteration and cost-efficiency.
          I selected Firebase for speed and treated AI models as interchangeable infrastructure rather than core product logic.
        </p>

        <MVPArchitecture />

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-5 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-2">My Role</h4>
            <p className="text-sm text-gray-600">Selected Firebase for speed; Designed cost-aware AI usage patterns; Implemented model interchangeability.</p>
          </div>
          <div className="p-5 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-2">Cost Strategy</h4>
            <p className="text-sm text-gray-600">Leveraged Google Gemini Free Tier and cached AI responses to minimize recurring API costs.</p>
          </div>
          <div className="p-5 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-2">Flexibility</h4>
            <p className="text-sm text-gray-600">Built abstraction layers to swap between OpenAI, DeepSeek, and other models rapidly.</p>
          </div>
        </div>
      </Section>

      {/* Section 5 & 6: Validation & Limitations */}
      <div className="bg-gray-50 py-20 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-16">
          <div>
            <h3 className="text-2xl font-bold mb-6">Real-World Validation</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-blue-600">5.0</span>
              <span className="text-lg text-gray-500 mb-2">/ 5.0 Ease of Use</span>
            </div>
            <div className="flex items-end gap-2 mb-8">
              <span className="text-5xl font-bold text-blue-600">4.0</span>
              <span className="text-lg text-gray-500 mb-2">/ 5.0 Reliability</span>
            </div>

            <h4 className="font-bold text-gray-900 mb-3">User Feedback (10+ Experts)</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                <span>High value proposition for educational purposes</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                <span>Clear and intuitive interface</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-700">
                <Activity size={16} className="text-orange-500 mt-0.5" />
                <span>Identified need for deeper data grounding (reliability)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6">Limitations & Learnings</h3>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ul className="space-y-4">
                {[
                  "Frontend-heavy MVP logic",
                  "Firebase optimized for speed, not correctness",
                  "No backend job pipelines yet",
                  "Limited personalization",
                  "No retrieval-grounded (RAG) explanations"
                ].map((limit, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="text-gray-400 font-mono">0{i + 1}.</span>
                    {limit}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm italic text-gray-500">
                  "Transparently documenting these limitations informed the architectural decisions for the next phase, avoiding premature optimization."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7 & 8: Evolution & RAG */}
      <Section id="roadmap" title="System Evolution" subtitle="Next Phase" dark>
        <p className="text-gray-400 max-w-2xl mb-12">
          Moving from a prototype to a scalable platform requires shifting logic to a dedicated backend and introducing retrieval-augmented generation (RAG) for credibility.
        </p>

        <FutureArchitecture />

        <div className="mt-16 grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Database className="text-purple-400" />
              RAG & Vector Database
            </h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Integrating a vector database to store financial news, historical insights, and user reflections.
              Retrieval-Augmented Generation will be used to ground AI outputs, reducing hallucinations and improving explainability.
            </p>
            <ul className="space-y-2">
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Ground AI outputs in real data
              </li>
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Reduce hallucinations
              </li>
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Cost-aware embedding storage
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <GitBranch className="text-blue-400" />
              Key Feature: One-Click Comparison
            </h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Enabling users to compare outputs from multiple AI models simultaneously to identify reasoning variance and produce more explainable, grounded insights.
            </p>
            <ul className="space-y-2">
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Compare multiple AI model outputs
              </li>
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Identify reasoning variance
              </li>
              <li className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Idempotent batch pipelines
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Section 9: Credibility Engine */}
      <Section id="research" title="Education & Credibility Engine" subtitle="Final Vision">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                  <Award size={20} />
                </div>
                <h4 className="font-bold text-gray-900">Credibility Score</h4>
                <p className="text-xs text-gray-500 mt-1">Earned through behavior, not luck.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Brain size={20} />
                </div>
                <h4 className="font-bold text-gray-900">Learning Feedback</h4>
                <p className="text-xs text-gray-500 mt-1">AI as assessor, not authority.</p>
              </div>
              <div className="col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center text-center">
                <Globe size={24} className="text-gray-400 mb-3" />
                <h4 className="font-bold text-gray-900">Multi-Market Expansion</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Cross-market reasoning comparison to reduce reliance on US-only perspectives and create a scalable global research platform.
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h3 className="text-2xl font-bold mb-4">Gamifying Financial Discipline</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The ultimate goal is to shift the focus from "did I make money?" to "did I think correctly?".
              The system rewards reasoning consistency, risk awareness, and behavioral discipline.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Users test investment theories using paper trading, real market data, and financial news,
              while the AI evaluates their <span className="font-semibold underline decoration-blue-300 decoration-2 underline-offset-2">process</span> rather than just the outcome.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
