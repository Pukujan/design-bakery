import React from "react";
import { Section } from "./Section";
import { MVPArchitecture } from "./Diagrams";
import {
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Activity,
  Search,
  Globe,
  Award,
  ArrowRight,
  GitBranch,
  Database,
  Brain,
  Layers,
  Target,
  FileSearch,
  BarChart3,
  Cpu
} from "lucide-react";

export function EngineeringCaseStudy() {
  return (
    <>
      {/* Intro Statement */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 border-y border-blue-700">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-blue-50 text-xl leading-relaxed mb-6 text-center">
            InvestAI started as an AI-assisted paper trading MVP.
          </p>
          <p className="text-blue-100 text-lg leading-relaxed mb-8 text-center">
            It has evolved into a financial reasoning evaluation platform where prompts, model tiers, retrieved context, market references, and confidence signals can be tested before AI insights are trusted.
          </p>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <p className="text-white text-center mb-4 font-medium">The core product question changed from:</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-500/20 p-4 rounded-lg border border-red-400/30">
                <p className="text-red-100 text-center italic">"What stock does the AI recommend?"</p>
              </div>
              <div className="bg-green-500/20 p-4 rounded-lg border border-green-400/30">
                <p className="text-green-100 text-center italic">"Can the system prove whether the AI insight is grounded, reliable, and improving?"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Motivation */}
      <Section id="motivation" title="Research Motivation & Problem Framing">
        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Retail investors often rely on opaque buy/sell signals, social media sentiment, influencer commentary, and static courses that are disconnected from real market behavior.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Most tools focus on prediction. Fewer tools help users evaluate the quality of their reasoning.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
            <p className="text-gray-900 font-semibold">InvestAI reframes the problem:</p>
            <p className="text-gray-700 mt-2">The goal is not to predict the market.</p>
            <p className="text-gray-700">The goal is to test how people and AI systems think about financial decisions.</p>
          </div>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <h4 className="font-bold text-gray-900 mb-6">There is currently no simple way to:</h4>
          <ul className="space-y-3">
            {[
              "Test investment theories safely without real-money risk",
              "Measure financial reasoning quality over time",
              "Compare human and AI reasoning consistency",
              "Separate lucky outcomes from disciplined thinking",
              "Evaluate whether an AI insight is grounded or just confident",
              "Track whether prompt changes actually improve AI output quality"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <ArrowRight className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 bg-gray-50 p-8 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-4">My Role</h4>
          <ul className="space-y-3">
            {[
              "Identified the gap between financial education, paper trading, and AI explanation quality",
              "Framed the product as a reasoning and credibility measurement system, not a trading signal app",
              "Designed the product experience, system architecture, AI workflows, and evaluation logic",
              "Built the frontend, backend, shared types, market data flows, agent jobs, and eval dashboards",
              "Defined constraints to avoid real-money risk, regulatory exposure, and misleading predictive claims"
            ].map((item, i) => (
              <li key={i} className="text-sm text-gray-600 border-l-2 border-gray-300 pl-4 py-1">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Core Hypothesis */}
        <div className="mt-16 bg-white p-8 rounded-xl border-2 border-blue-200 shadow-sm">
          <span className="text-sm font-bold tracking-wider uppercase text-blue-600 mb-4 block">Core Research Hypothesis</span>
          <blockquote className="text-xl font-serif text-gray-900 leading-relaxed italic">
            Financial reasoning and credibility can be evaluated more reliably through repeatable paper trading experiments, contextual AI explanations, behavioral consistency, and market-grounded evals than through isolated predictions or short-term gains.
          </blockquote>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              label: "Reasoning Quality",
              icon: Lightbulb,
              desc: "Can the user or AI explain the decision with context, risk, and evidence?"
            },
            {
              label: "Risk Awareness",
              icon: ShieldAlert,
              desc: "Does the system reward disciplined thinking instead of lucky guesses?"
            },
            {
              label: "Consistency Over Time",
              icon: Activity,
              desc: "Can reasoning quality be tracked across repeated experiments?"
            }
          ].map((metric) => (
            <div key={metric.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <metric.icon size={24} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{metric.label}</h4>
              <p className="text-sm text-gray-600">{metric.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Product Evolution */}
      <Section id="product" className="bg-gray-50" title="From MVP to Evaluation Platform">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-700 leading-relaxed mb-6">
            The first version of InvestAI was a frontend-heavy MVP focused on paper trading, AI sentiment analysis, portfolio views, and financial news.
          </p>
          <p className="text-gray-700 leading-relaxed mb-8">
            The latest version moves the product into full-stack AI quality engineering.
          </p>
          <p className="text-gray-700 leading-relaxed">
            InvestAI now includes a dedicated backend, modular frontend, shared TypeScript types, live/mock/agent data modes, background agent jobs, prompt evaluation dashboards, usage limits, persistent eval history, and market-grounded visual comparison.
          </p>
        </div>

        <div className="mt-12 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-6">Current Capabilities</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Paper trading focused on learning and behavioral discipline",
              "AI-assisted financial insight generation",
              "Market sentiment and news context",
              "Portfolio tracking and watchlist flows",
              "Live/mock/agent data modes",
              "Background agent chart jobs",
              "Prompt eval experiments across multiple LLM tiers",
              "Yahoo EOD comparison for prompt and chart evals",
              "Optional RAG context for grounded experiments",
              "Run history, deviation charts, and improvement tracking",
              "Token/cost estimate evaluation",
              "Structured AI output validation",
              "Cost-aware usage limits and cached AI outputs",
              "Confidence score dataset development"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <a
            href="https://financial-investment-with-gemini-in.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            View Live Demo
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

        <div className="mt-12 text-center">
          <div className="inline-block bg-blue-50 border border-blue-200 px-6 py-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-800">Working Full-Stack MVP</p>
            <p className="text-xs text-blue-600 mt-1">InvestAI is functional as both a user-facing product and an AI quality research system</p>
          </div>
        </div>
      </Section>

      {/* AI Quality System */}
      <Section id="ai-quality" title="AI Quality System">
        <div className="max-w-3xl mx-auto mb-12">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            The newest version of InvestAI focuses on one question:
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200">
            <p className="text-2xl font-bold text-gray-900 text-center">
              Can AI-generated financial reasoning be evaluated visually, repeatedly, and against market reference data?
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed mt-6">
            To answer that, I built an evaluation layer that compares agent outputs against Yahoo EOD reference data, tracks prompt experiment history, records RAG context, compares model tiers, and gives operators visual proof when a prompt or model configuration improves.
          </p>
        </div>

        {/* Prompt Evaluation Dashboard */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileSearch className="text-blue-600" />
            Prompt Evaluation Dashboard
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            InvestAI now includes a prompt evaluation workflow for testing whether AI outputs are actually improving. Instead of manually judging whether a prompt sounds better, the system runs structured experiments across multiple LLM tiers and compares their outputs against Yahoo EOD reference data.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Prompt version", icon: FileSearch },
              { label: "Model tier", icon: Cpu },
              { label: "Yahoo EOD reference values", icon: Database },
              { label: "Quote deviation", icon: Target },
              { label: "Daily EOD deviation", icon: BarChart3 },
              { label: "RAG chunks retrieved", icon: Search },
              { label: "Token usage", icon: Layers },
              { label: "Cost estimate", icon: TrendingUp },
              { label: "Improvement vs previous run", icon: ArrowRight }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <item.icon className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Prompt Evaluation Loop</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Prompt version</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Model-tier experiment</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Optional RAG retrieval</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Yahoo EOD comparison</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Deviation scoring</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Run history</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-white px-3 py-1 rounded border border-gray-300">Operator review</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="bg-green-100 px-3 py-1 rounded border border-green-300 font-medium">Improved AI quality</span>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Important note:</span> Prompt eval does not automatically rewrite all insight prompts yet. It validates improvements first, then the operator can promote better prompt patterns into production agent jobs and future AI insight workflows.
            </p>
          </div>
        </div>

        {/* Confidence Score Dataset */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="text-purple-600" />
            Confidence Score Dataset Development
          </h3>
          <p className="text-gray-700 leading-relaxed mb-6 max-w-3xl">
            A major next-stage focus is building confidence score datasets that help the system evaluate when an AI insight is strong, weak, risky, under-grounded, or too uncertain to trust.
          </p>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            The goal is not only to generate financial commentary. The goal is to score the quality of that commentary before presenting it as a trusted insight.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Deviation from market reference data",
              "Model output consistency",
              "Prompt-version performance",
              "RAG context coverage",
              "Token/cost efficiency",
              "Structured AI confidence fields",
              "Historical eval results",
              "Operator-reviewed outcomes"
            ].map((signal, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{signal}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-purple-50 p-6 rounded-xl border border-purple-200">
            <p className="text-gray-700 leading-relaxed">
              This creates the foundation for more accurate future AI insights because the system can learn which prompts, model tiers, and retrieved contexts produce better-aligned outputs.
            </p>
          </div>
        </div>

        {/* RAG-Grounded Experiments */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Search className="text-indigo-600" />
            RAG-Grounded Experiments
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            InvestAI uses retrieval-augmented generation as an experiment layer, not as an unquestioned authority. When RAG is enabled, the system retrieves relevant market or news context, injects it into the prompt, records the retrieved chunks, and lets the operator compare whether RAG improved or worsened the output.
          </p>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            This turns RAG from a hidden black box into a measurable variable.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Retrieve", desc: "Find relevant company, market, or news context", icon: Search },
              { label: "Augment", desc: "Inject retrieved context into the model prompt", icon: Layers },
              { label: "Measure", desc: "Compare output against Yahoo EOD reference data", icon: BarChart3 },
              { label: "Review", desc: "Show retrieved chunks, run logs, and deviation charts", icon: FileSearch }
            ].map((step) => (
              <div key={step.label} className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <step.icon size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{step.label}</h4>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model-Tier Comparison */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <GitBranch className="text-green-600" />
            Model-Tier Comparison
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            Prompt eval experiments compare multiple OpenRouter model tiers in the same run. This helps answer practical AI product questions:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Which model produced the lowest deviation?",
              "Which model performed best for the cost?",
              "Did a cheaper model perform well enough?",
              "Did RAG help all tiers or only one?",
              "Did the prompt improve compared to the previous version?"
            ].map((question, i) => (
              <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold flex-shrink-0 mt-0.5">
                  ?
                </div>
                <span className="text-sm text-gray-700">{question}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Proof */}
        <div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="text-orange-600" />
            Visual Proof
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8 max-w-3xl">
            InvestAI uses charts and run logs to make AI quality visible. The eval dashboard can show:
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              "Yahoo reference bars beside agent outputs",
              "30-day EOD lines across multiple model tiers",
              "Daily deviation charts",
              "Run logs with prompt version and tier summaries",
              "RAG retrieval evidence",
              "Improvement badges compared to previous experiments"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
            <h4 className="font-semibold text-gray-900 mb-4">Instead of asking "Did the model sound convincing?", InvestAI asks:</h4>
            <ul className="space-y-2">
              {[
                "How far was the output from market reference data?",
                "Did RAG reduce deviation?",
                "Which model tier performed best for the cost?",
                "Did the prompt improve compared to the previous run?",
                "Can the operator inspect the reasoning trail?",
                "Should this insight be trusted, reviewed, or downgraded?"
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <ArrowRight className="text-orange-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Engineering Highlights - Continued in next message due to length */}
      <Section id="engineering" className="bg-gray-50" title="Engineering Highlights">
        <p className="text-gray-700 leading-relaxed mb-12 max-w-3xl">
          The latest development cycle focused on turning InvestAI from a prototype into a controlled AI evaluation system.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <GitBranch size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Modular Monolith Refactor</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Restructured the app into npm workspaces with separate frontend, backend, and shared TypeScript packages. This moved the project from prototype structure into a scalable full-stack system with clearer module boundaries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Database size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Live / Mock / Agent Data Modes</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Separated market data sources so the platform can distinguish real market references, demo fixtures, and AI-generated experimental outputs. This prevents LLM-generated data from being treated as authoritative.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mb-4">
              <Activity size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Agent Chart Jobs</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Built background agent jobs that generate 30-day chart data through OpenRouter model tiers. Agent mode focuses on controlled chart experiments, cached runs, and measurable alignment against reference data.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Prompt Eval Dashboard</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Created a prompt evaluation workflow that runs multiple LLM tiers in one experiment, compares outputs against Yahoo EOD reference data, and displays results through comparison charts and deviation metrics.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Search size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">RAG-Grounded Evaluation</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Added optional retrieval-augmented generation for prompt tests. The system retrieves context, injects it into the prompt, and records which chunks influenced the run so reasoning improvements can be traced.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <ShieldAlert size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Usage Limits & Demo Safety</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Added separate usage limiters for agent runs and prompt tests. This protects API cost, supports a public demo environment, and keeps expensive AI operations controlled without blocking normal browsing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 mb-4">
              <FileSearch size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Eval Audit Trail</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Stored prompt experiments, RAG retrieval logs, estimate evals, and chart evals across browser, disk, and Firestore-backed flows so AI quality work can be reviewed over time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Structured AI Validation</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Added validation rules for AI insight outputs so recommendations, risks, trends, portfolio advice, accuracy fields, and confidence values must follow an expected structure before being treated as usable UI data.
            </p>
          </div>
        </div>
      </Section>

      {/* Technical Architecture */}
      <Section id="architecture" title="Technical Architecture">
        <p className="text-gray-700 leading-relaxed mb-12 max-w-3xl">
          InvestAI uses a modular full-stack architecture designed around AI evaluation, market-data separation, and prompt quality measurement.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "Frontend",
              desc: "React + Vite interface with feature-based modules, reusable data providers, market dashboards, paper trading views, eval dashboards, chart comparison views, and floating job-progress UI."
            },
            {
              title: "Backend",
              desc: "Node.js / Express API handling market-data modes, provider integration, AI orchestration, background jobs, prompt experiments, RAG retrieval, usage limits, auth status, caching, eval persistence, and structured validation."
            },
            {
              title: "Shared TypeScript Package",
              desc: "Common TypeScript types are shared across frontend and backend so agent jobs, eval records, market data, prompt-test results, chart evals, and confidence signals stay consistent across the system."
            },
            {
              title: "AI Layer",
              desc: "OpenRouter-powered model tiers are used for controlled agent experiments, prompt tests, chart jobs, and reasoning workflows. AI outputs are evaluated against reference data instead of being treated as unquestioned truth."
            },
            {
              title: "Evaluation Layer",
              desc: "Prompt evals compare multiple model tiers against Yahoo EOD reference data, persist run history, and visualize quote deviation, daily deviation, RAG context, token usage, and improvement over previous experiments."
            },
            {
              title: "Confidence Layer",
              desc: "Confidence score datasets are being developed to help future AI insights communicate reliability, uncertainty, grounding quality, and deviation risk."
            }
          ].map((layer, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3">{layer.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{layer.desc}</p>
            </div>
          ))}
        </div>

        <MVPArchitecture />
      </Section>

      {/* Data Lifecycle & Cache Architecture */}
      <Section id="data-lifecycle" className="bg-gray-50" title="Data Lifecycle & Cache Architecture">
        <p className="text-gray-700 leading-relaxed mb-12 max-w-3xl">
          A major engineering decision was separating temporary market cache, AI output cache, eval audit history, portfolio persistence, and frontend display state. This prevents experiment logs, market data, AI insights, and user holdings from being mixed together.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              title: "Memory Cache",
              desc: "Short-lived server-side cache for market quotes, news, and charts. Used for fast repeated reads inside a single Node process.",
              icon: Cpu
            },
            {
              title: "Firestore Cache",
              desc: "Cross-restart cache for AI insights, predictions, market bulk data, and agent bulk data when Firebase is configured.",
              icon: Database
            },
            {
              title: "Disk Eval History",
              desc: "Persistent server-side JSON storage for estimate, chart, and prompt eval logs. This keeps AI quality history separate from quote caches.",
              icon: FileSearch
            },
            {
              title: "Portfolio Persistence",
              desc: "User holdings are treated as persistent data, not TTL cache.",
              icon: TrendingUp
            },
            {
              title: "React State",
              desc: "Frontend providers hold UI display data for the current browser tab, but HTTP response caching is intentionally not handled in the frontend.",
              icon: Layers
            }
          ].map((cache) => (
            <div key={cache.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <cache.icon className="text-blue-600 w-10 h-10 mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">{cache.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{cache.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">Architecture Principle</h4>
          <p className="text-gray-700">
            The system separates source data, generated AI outputs, eval history, and user records so each layer can be trusted, refreshed, inspected, or discarded independently.
          </p>
        </div>
      </Section>

      {/* Ground Truth & Eval References */}
      <Section id="ground-truth" title="Ground Truth & Eval References">
        <p className="text-gray-700 leading-relaxed mb-12 max-w-3xl">
          InvestAI uses multiple evaluation references instead of one vague "golden dataset."
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Yahoo EOD Reference",
              desc: "Used for prompt eval and chart eval comparison. Each point represents the session close for a trading day."
            },
            {
              title: "Prompt Eval Golden",
              desc: "Stored per experiment so each prompt run can be compared against the same reference values."
            },
            {
              title: "Chart Daily-vs-Live Comparison",
              desc: "Used after agent chart jobs to compare the agent-generated 30-day EOD shape against Yahoo reference bars."
            },
            {
              title: "Static Golden JSON",
              desc: "Used for regression testing quote and news agent output structure. These fixtures support CI-style checks and are separate from live Yahoo eval references."
            }
          ].map((ref, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold mb-4">
                {i + 1}
              </div>
              <h4 className="font-bold text-gray-900 mb-3">{ref.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{ref.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-2">Principle</h4>
          <p className="text-gray-700">
            The system treats market reference data, regression fixtures, and AI-generated outputs as separate evidence types.
          </p>
        </div>
      </Section>

      {/* Early Product Validation */}
      <Section id="validation" className="bg-gray-50" title="Early Product Validation">
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-4xl mx-auto">
          <div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-blue-600">5.0</span>
              <span className="text-lg text-gray-500 mb-2">/ 5.0 Ease of Use</span>
            </div>
            <div className="flex items-end gap-2 mb-8">
              <span className="text-5xl font-bold text-blue-600">4.0</span>
              <span className="text-lg text-gray-500 mb-2">/ 5.0 Reliability</span>
            </div>

            <h4 className="font-bold text-gray-900 mb-4">Feedback from 10+ expert reviewers:</h4>
            <ul className="space-y-3">
              {[
                "Strong educational value",
                "Clear and intuitive interface",
                "Useful framing around learning instead of gambling",
                "Need for deeper data grounding and reliability checks"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-3">Interpretation</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              This feedback shaped the next architecture phase. Instead of only improving the UI, I focused on market grounding, eval dashboards, prompt history, RAG evidence, and confidence scoring foundations.
            </p>
          </div>
        </div>
      </Section>

      {/* Limitations & Learnings */}
      <Section id="learnings" title="Limitations & Learnings">
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            {
              num: "01",
              title: "Market data is constrained",
              desc: "Financial market APIs have strict rate limits, pricing differences, delayed data, and provider-specific behavior. Reliable data access is a product architecture problem, not just an API choice."
            },
            {
              num: "02",
              title: "LLM-generated market data is experimental",
              desc: "AI-generated market data should never be treated as authoritative. It is useful for controlled experiments, chart comparison, and prompt testing, not trading decisions."
            },
            {
              num: "03",
              title: "Prompt quality needs measurement",
              desc: "A prompt that sounds better is not necessarily better. Visual evals, deviation metrics, and ground-truth comparison are necessary to know whether a prompt actually improved."
            },
            {
              num: "04",
              title: "RAG must be inspectable",
              desc: "RAG helps only when retrieval is logged, inspected, and measured against output quality. Hidden retrieval does not automatically create trustworthy reasoning."
            },
            {
              num: "05",
              title: "Cost control is part of AI product design",
              desc: "Usage limits, caching, background jobs, model-tier selection, and token estimate evals are necessary even in a demo system."
            },
            {
              num: "06",
              title: "Data lifecycle matters",
              desc: "Temporary market data, AI insight cache, eval audit logs, and portfolio records need different storage rules. Treating all data the same creates reliability and trust problems."
            },
            {
              num: "07",
              title: "Confidence should be earned",
              desc: "AI insights should not appear trustworthy because the model sounds confident. Confidence should come from source quality, prompt performance, deviation checks, and reviewable evidence."
            }
          ].map((learning) => (
            <div key={learning.num} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg flex-shrink-0">
                  {learning.num}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">{learning.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{learning.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap" className="bg-gray-50" title="Roadmap: From Evaluation Infrastructure to Insight Reliability">
        <p className="text-gray-700 leading-relaxed mb-12 max-w-3xl">
          The next phase is about connecting the evaluation layer more directly to the user-facing AI insight experience.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Near-Term</h4>
            <ul className="space-y-3">
              {[
                "Expand confidence score datasets",
                "Connect confidence signals to AI insight cards",
                "Improve prompt eval comparison views",
                "Add stronger RAG retrieval quality metrics",
                "Store operator-reviewed prompt outcomes",
                "Improve structured AI insight validation",
                "Clarify source labels across Live, Mock, and Agent modes"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Mid-Term</h4>
            <ul className="space-y-3">
              {[
                "Create reusable prompt-quality benchmarks",
                "Compare model tiers across market conditions",
                "Score AI insights by grounding, consistency, and deviation",
                "Add personalized learning feedback for paper-trading users",
                "Improve portfolio-level reasoning and risk-awareness evaluation",
                "Expand RAG sources beyond demo catalog and mock news"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Long-Term</h4>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                Build an AI financial reasoning quality engine where users and AI models are evaluated by consistency, risk awareness, evidence quality, and decision discipline instead of short-term market luck.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Confidence Score Engine",
              desc: "Turn eval results, RAG coverage, model consistency, and deviation metrics into user-facing confidence indicators.",
              icon: Target
            },
            {
              title: "RAG Expansion",
              desc: "Move beyond demo catalog and mock news toward richer financial context, historical reasoning notes, and future vector storage.",
              icon: Search
            },
            {
              title: "Insight Reliability Loop",
              desc: "Use prompt eval history to improve the quality of future AI insights while keeping operator review in the loop.",
              icon: TrendingUp
            },
            {
              title: "Multi-Market Expansion",
              desc: "Compare reasoning across different markets to reduce overreliance on US-only examples.",
              icon: Globe
            },
            {
              title: "Learning Feedback",
              desc: "Help users improve decision discipline by evaluating their reasoning process, not just portfolio results.",
              icon: Brain
            }
          ].map((card) => (
            <div key={card.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <card.icon className="text-blue-600 w-10 h-10 mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">{card.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Final Vision */}
      <Section id="vision" title="Final Vision">
        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            InvestAI is designed to become an education and credibility engine for financial reasoning.
          </p>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-xl mb-12">
            <p className="text-white text-lg mb-4">The ultimate goal is to shift the focus from:</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <p className="text-red-200 text-xl font-serif italic text-center">"Did I make money?"</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                <p className="text-green-200 text-xl font-serif italic text-center">"Did I think correctly?"</p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-12">
            The system rewards reasoning consistency, risk awareness, evidence quality, and disciplined decision-making. Users test investment theories using paper trading, market data, financial news, and AI explanations while the system evaluates the reasoning process behind each decision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Credibility Score",
              desc: "Earned through reasoning behavior, not luck.",
              icon: Award
            },
            {
              title: "Learning Feedback",
              desc: "AI as assessor and coach, not authority.",
              icon: Brain
            },
            {
              title: "Market-Grounded AI",
              desc: "Insights measured against reference data and retrieved context.",
              icon: BarChart3
            },
            {
              title: "Human Review",
              desc: "Operators can inspect charts, logs, RAG evidence, and confidence signals before trusting outputs.",
              icon: FileSearch
            }
          ].map((card) => (
            <div key={card.title} className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <card.icon size={24} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{card.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-blue-50 border-2 border-blue-200 px-8 py-6 rounded-xl">
            <p className="text-gray-700 italic leading-relaxed max-w-2xl">
              InvestAI is a research-driven system designed to evaluate how people and AI systems think about investing. AI is used as a tool for explanation, comparison, and learning, not as an unquestioned authority.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
