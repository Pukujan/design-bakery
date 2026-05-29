import { motion } from "motion/react";
import {
  FlaskConical,
  Search,
  Target,
  Layers,
  Rocket,
  Lightbulb,
  ArrowRight,
  Users,
  ClipboardList,
  SplitSquareHorizontal,
  MonitorPlay,
  Figma,
  BarChart3,
} from "lucide-react";
import { CaseStudyImage } from "./CaseStudyScreenshot";
import {
  ekagajpatraUxAssets,
  uxFallbackLabel,
  type UxVisualSlot,
} from "./ekagajpatraUxAssets";

const { prototypeEvolution: pe, abTests: ab } = ekagajpatraUxAssets;

const USER_GROUPS = [
  "First-time digital users",
  "Small-business owners",
  "Students",
  "Semi-urban users",
  "Low-literacy users",
  "Users familiar with broker-assisted documentation",
];

const TESTING_FOCUS = [
  "Understand the document flow",
  "Choose the right service",
  "Complete required fields",
  "Recover from confusion",
  "Trust the generated output",
  "Finish without broker help",
];

const UX_IMPROVEMENTS = [
  "Guided steps",
  "Clearer visual hierarchy",
  "Contextual explanations",
  "Video guidance",
  "Romanized Nepali input",
  "Preview-before-download flow",
  "Dashboard access to generated documents",
];

const DIAMOND_PHASES = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Field research, broker fee mapping, and behavioral studies across urban and semi-urban Nepal.",
  },
  {
    icon: Target,
    title: "Define",
    description:
      "Personas for low-literacy citizens priced out of legal participation; trust and affordability as core requirements.",
  },
  {
    icon: Layers,
    title: "Develop",
    description:
      "A/B prototypes for dense catalogs, task blocks, guided forms, contextual help, and previews.",
  },
  {
    icon: Rocket,
    title: "Deliver",
    description:
      "Shipped iterative releases with measured completion time and rate improvements over eight months.",
  },
];

const PROTOTYPE_GALLERY: Array<{
  label: string;
  slot: UxVisualSlot;
  caption: string;
  insight: string;
}> = [
  {
    label: "Early Prototype",
    slot: {
      path: pe.earlyPrototype,
      fallbackLabel: uxFallbackLabel(pe.earlyPrototype),
      kind: "wireframe",
    },
    caption: "Dense document browsing made it unclear where users should begin.",
    insight: "Users needed a clearer starting point and fewer competing choices.",
  },
  {
    label: "Service Grouping",
    slot: {
      path: pe.serviceGrouping,
      fallbackLabel: uxFallbackLabel(pe.serviceGrouping),
      kind: "verified-image",
    },
    caption: "Documents were grouped into real-world administrative tasks.",
    insight: "Users understood categories faster when the UI matched offline workflows.",
  },
  {
    label: "Guided Form Flow",
    slot: {
      path: pe.guidedForm,
      fallbackLabel: uxFallbackLabel(pe.guidedForm),
      kind: "verified-image",
    },
    caption: "Long forms were broken into smaller guided steps with contextual guidance.",
    insight: "Step-based progression reduced confusion and missed fields.",
  },
  {
    label: "Contextual Help",
    slot: {
      path: pe.contextualHelp,
      fallbackLabel: uxFallbackLabel(pe.contextualHelp),
      kind: "wireframe",
    },
    caption: "Guidance, tooltips, and video support were moved closer to the form.",
    insight: "Users trusted the process more when help appeared at the moment of confusion.",
  },
  {
    label: "Preview Before Download",
    slot: {
      path: pe.previewBeforeDownload,
      fallbackLabel: uxFallbackLabel(pe.previewBeforeDownload),
      kind: "verified-image",
    },
    caption: "Users could review generated output before finalizing.",
    insight: "Preview reduced fear of making mistakes.",
  },
  {
    label: "Dashboard Access",
    slot: {
      path: pe.dashboardAccess,
      fallbackLabel: uxFallbackLabel(pe.dashboardAccess),
      kind: "placeholder",
      placeholderTitle: "Dashboard screenshot needed",
      placeholderHint: "Use only a clean dashboard/document-access screenshot.",
    },
    caption: "Generated documents were saved for later review and download.",
    insight: "Saved access made the product feel more reliable and trustworthy.",
  },
];

const AB_TESTS = [
  {
    title: "Document Catalog vs Task-Based Service Blocks",
    versionA: {
      label: "Version A — dense catalog",
      title: "Dense document list / catalog",
      problem: "Users did not know which document matched their real-world task.",
      slot: {
        path: ab.catalogA,
        fallbackLabel: uxFallbackLabel(ab.catalogA),
        kind: "wireframe" as const,
      },
    },
    versionB: {
      label: "Version B — task blocks",
      title: "Task-based service grouping",
      result: "Users understood the starting point faster and made fewer wrong selections.",
      slot: {
        path: ab.taskBlocksB,
        fallbackLabel: uxFallbackLabel(ab.taskBlocksB),
        kind: "verified-image" as const,
      },
    },
  },
  {
    title: "Open Form vs Guided Step Flow",
    versionA: {
      label: "Version A — open form",
      title: "Long form with many fields visible at once",
      problem: "Users felt overwhelmed and abandoned the process earlier.",
      slot: {
        path: ab.longFormA,
        fallbackLabel: uxFallbackLabel(ab.longFormA),
        kind: "wireframe" as const,
      },
    },
    versionB: {
      label: "Version B — guided flow",
      title: "Multi-step guided form with progress indicators",
      result: "Reduced cognitive load and improved completion.",
      slot: {
        path: ab.guidedFormB,
        fallbackLabel: uxFallbackLabel(ab.guidedFormB),
        kind: "verified-image" as const,
      },
    },
  },
  {
    title: "Final Download Only vs Preview Before Download",
    versionA: {
      label: "Version A — download only",
      title: "Generate/download at the end with limited review",
      problem: "Users were unsure whether their information was correct.",
      slot: {
        path: ab.downloadOnlyA,
        fallbackLabel: uxFallbackLabel(ab.downloadOnlyA),
        kind: "wireframe" as const,
      },
    },
    versionB: {
      label: "Version B — preview first",
      title: "Preview-before-download flow",
      result: "Increased trust before final document generation.",
      slot: {
        path: ab.previewFlowB,
        fallbackLabel: uxFallbackLabel(ab.previewFlowB),
        kind: "verified-image" as const,
      },
    },
  },
];

const RESEARCH_METHODS = [
  { icon: Users, label: "In-person walkthroughs" },
  { icon: ClipboardList, label: "Online demo surveys" },
  { icon: SplitSquareHorizontal, label: "A/B prototype tests" },
  { icon: MonitorPlay, label: "First-time-user task testing" },
  { icon: Figma, label: "Figma prototype testing" },
  { icon: BarChart3, label: "Demographic variation testing" },
];

const TIMELINE = [
  {
    title: "Early prototype",
    description: "Users were unsure where to begin in a dense document catalog.",
  },
  {
    title: "Service grouping",
    description: "Task blocks helped users recognize real-world administrative processes faster.",
  },
  {
    title: "Guided form flow",
    description: "Chunked steps reduced cognitive load and made missing fields easier to catch.",
  },
  {
    title: "Contextual help and video guidance",
    description: "Support moved next to the form instead of hidden in help pages, improving confidence.",
  },
  {
    title: "Preview and dashboard",
    description: "Preview-before-download and saved documents increased trust before final generation.",
  },
];

const UX_INSIGHTS = [
  "Users needed guidance before forms",
  "Trust had to be visible, not implied",
  "One-path flows worked better than open navigation",
  "Plain language beat legal terminology",
  "Preview reduced fear of mistakes",
  "Familiar patterns mattered more than trendy UI",
];

const METRICS_CAPTION = "Measured over 8 months of iteration.";

function MetricBar({ width }: { width: string }) {
  return (
    <div className="h-3 rounded-full bg-gray-200 overflow-hidden mt-3">
      <div
        className="h-full rounded-full bg-gradient-to-r from-secondary to-yellow-300"
        style={{ width }}
      />
    </div>
  );
}

function PrototypeGalleryCard({
  item,
  index,
}: {
  item: (typeof PROTOTYPE_GALLERY)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.06 * index, duration: 0.5 }}
      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm"
    >
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center gap-3">
        <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
          {item.label}
        </span>
      </div>
      <div className="p-4 bg-slate-50">
        <CaseStudyImage slot={item.slot} alt={item.label} />
      </div>
      <div className="p-5 space-y-2">
        <p className="text-gray-700 leading-relaxed">{item.caption}</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-primary">Testing insight:</span> {item.insight}
        </p>
      </div>
    </motion.article>
  );
}

type AbSide = {
  label: string;
  title: string;
  slot: UxVisualSlot;
  problem?: string;
  result?: string;
};

function AbTestVersionCard({ variant, type }: { variant: AbSide; type: "a" | "b" }) {
  const isA = type === "a";

  return (
    <div className="flex-1 min-w-0 rounded-3xl border border-gray-200 overflow-hidden bg-white">
      <div
        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b border-gray-200 ${
          isA ? "bg-gray-100 text-gray-600" : "bg-secondary/30 text-primary"
        }`}
      >
        {variant.label}
      </div>
      <div className="p-4">
        <CaseStudyImage slot={variant.slot} alt={variant.title} className="mb-4" />
        <h4 className="font-bold text-primary mb-2">{variant.title}</h4>
        {variant.problem ? (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Problem:</span> {variant.problem}
          </p>
        ) : null}
        {variant.result ? (
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-secondary">Result:</span> {variant.result}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PrototypeTestingSectionV2() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <FlaskConical className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">
              From Prototype Testing to Faster Document Completion
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-xl text-gray-700 leading-relaxed mb-10"
          >
            Ekagajpatra was not designed in one pass. Over roughly one year, the product went through
            repeated prototype cycles using Double Diamond-style discovery and delivery loops,
            in-person walkthroughs, online demo surveys, and A/B tests with about 100 users across
            different demographics.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-lg p-8 border border-gray-200"
            >
              <h3 className="text-xl font-bold text-primary mb-4">User groups</h3>
              <ul className="space-y-2">
                {USER_GROUPS.map((group) => (
                  <li key={group} className="flex items-start gap-2 text-gray-700">
                    <span className="text-secondary font-bold mt-0.5">•</span>
                    <span>{group}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="bg-white rounded-lg p-8 border border-gray-200"
            >
              <h3 className="text-xl font-bold text-primary mb-4">Testing focus</h3>
              <p className="text-gray-600 mb-4">We tested whether users could:</p>
              <ul className="space-y-2">
                {TESTING_FOCUS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700">
                    <span className="text-secondary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-14"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">Double Diamond research loop</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DIAMOND_PHASES.map((phase, index) => (
                <motion.div
                  key={phase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * index, duration: 0.5 }}
                  className="bg-white rounded-3xl p-6 border border-gray-200 relative min-h-[174px]"
                >
                  {index < DIAMOND_PHASES.length - 1 ? (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary z-10" />
                  ) : null}
                  <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-secondary text-primary font-black text-sm mb-3">
                    {index + 1}
                  </span>
                  <h4 className="text-lg font-bold text-primary mb-2">{phase.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{phase.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.42, duration: 0.6 }}
            className="mb-14"
          >
            <h3 className="text-2xl font-bold text-primary mb-2">Prototype Evolution</h3>
            <p className="text-gray-600 mb-4">
              This section only uses screenshots that match the claim. Missing early screenshots are
              shown as intentional wireframes/placeholders instead of unrelated images.
            </p>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 text-yellow-900 px-4 py-3 text-sm mb-8">
              <span className="font-bold">Image rule:</span> no presentation-stage photos, award logos,
              video frames with timestamp overlays, or random homepage images inside the A/B evidence
              blocks.
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {PROTOTYPE_GALLERY.map((item, index) => (
                <PrototypeGalleryCard key={item.label} item={item} index={index} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.44, duration: 0.6 }}
            className="mb-14"
          >
            <h3 className="text-2xl font-bold text-primary mb-2">
              A/B Tests That Changed the Product
            </h3>
            <p className="text-gray-600 mb-8">
              Version A wireframes stand in for missing early variants. Version B only uses confirmed
              screenshots that match the label.
            </p>
            <div className="space-y-8">
              {AB_TESTS.map((test, index) => (
                <motion.div
                  key={test.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * index, duration: 0.5 }}
                  className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm"
                >
                  <h4 className="text-lg md:text-xl font-bold text-primary mb-6">{test.title}</h4>
                  <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-5">
                    <AbTestVersionCard variant={test.versionA} type="a" />
                    <div className="flex lg:flex-col items-center justify-center gap-2 shrink-0 py-2">
                      <div className="w-14 h-14 rounded-full border border-yellow-300 bg-yellow-50 text-primary font-black text-2xl grid place-items-center">
                        →
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                        Changed to
                      </span>
                    </div>
                    <AbTestVersionCard variant={test.versionB} type="b" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.46, duration: 0.6 }}
            className="mb-14"
          >
            <h3 className="text-2xl font-bold text-primary mb-8">Measured Usability Improvements</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-primary mb-4">Completion Time</h4>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold">Before</p>
                    <p className="text-4xl font-black text-red-700 tracking-tight">190s</p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold">After</p>
                    <p className="text-4xl font-black text-green-600 tracking-tight">28s</p>
                  </div>
                </div>
                <MetricBar width="85%" />
                <p className="mt-4 text-sm text-gray-600">
                  About 85% faster, saving 162 seconds per document flow.
                </p>
                <p className="mt-2 text-sm text-gray-500">{METRICS_CAPTION}</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm border-l-4 border-l-secondary">
                <h4 className="text-lg font-bold text-primary mb-4">Completion Rate</h4>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold">Before</p>
                    <p className="text-4xl font-black text-red-700 tracking-tight">34%</p>
                  </div>
                  <ArrowRight className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold">After</p>
                    <p className="text-4xl font-black text-green-600 tracking-tight">87%</p>
                  </div>
                </div>
                <MetricBar width="87%" />
                <p className="mt-4 text-sm text-gray-600">+53 percentage points.</p>
                <p className="mt-2 text-sm text-gray-500">{METRICS_CAPTION}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.48, duration: 0.6 }}
            className="mb-14"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">How We Tested</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {RESEARCH_METHODS.map((method, index) => (
                <motion.div
                  key={method.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index, duration: 0.5 }}
                  className="bg-white rounded-2xl border border-gray-200 p-4 font-bold text-primary shadow-sm"
                >
                  {method.label}
                </motion.div>
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed bg-white rounded-lg p-6 border border-gray-200">
              Testing included about 100 users across different demographics over roughly one year,
              including first-time digital users, small-business owners, students, semi-urban users,
              low-literacy users, and users familiar with broker-assisted documentation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">Prototype evolution timeline</h3>
            <div className="relative pl-6 border-l-2 border-secondary/40 space-y-8">
              {TIMELINE.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * index, duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute -left-[1.6rem] top-1.5 w-3 h-3 rounded-full bg-secondary" />
                  <h4 className="text-lg font-bold text-primary mb-1">{item.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-8 h-8 text-secondary" />
              <h3 className="text-2xl font-bold text-primary">UX insights from testing</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {UX_INSIGHTS.map((insight, index) => (
                <motion.div
                  key={insight}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index, duration: 0.5 }}
                  className="bg-primary text-primary-foreground rounded-lg p-5 border border-secondary/20"
                >
                  <p className="leading-relaxed">{insight}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white rounded-lg p-8 border border-gray-200"
          >
            <h3 className="text-xl font-bold text-primary mb-4">Main UX improvements shipped</h3>
            <div className="flex flex-wrap gap-3">
              {UX_IMPROVEMENTS.map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full bg-secondary/15 text-primary text-sm font-medium border border-secondary/30"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
