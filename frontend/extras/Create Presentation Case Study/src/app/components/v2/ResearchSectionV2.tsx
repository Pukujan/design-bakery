import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Search, MapPin, TrendingUp, Smartphone, Quote } from "lucide-react";

type ResearchStudy = {
  icon: LucideIcon;
  studyName: string;
  methods: string;
  findings: string;
};

const RESEARCH_STUDIES: ResearchStudy[] = [
  {
    icon: MapPin,
    studyName: "Socio-Economic & Demographic Analysis",
    methods:
      "Desk research plus field mapping of literacy rates, household income bands, and digital access across urban, semi-urban, and rural Nepal.",
    findings:
      "Defined primary personas: low-income individuals, micro-business owners, and rural users excluded from formal documentation channels.",
  },
  {
    icon: TrendingUp,
    studyName: "User Research & Market Survey (2023)",
    methods:
      "Structured interviews and market surveys with citizens, brokers, and small-business owners on documentation costs, trust, and workflow pain points.",
    findings:
      "Documented broker fee inflation (often 10-20x legitimate costs), legal risk from unregistered agents, and lack of price transparency.",
  },
  {
    icon: Smartphone,
    studyName: "Behavioral & Digital Platform Research",
    methods:
      "Competitive and behavioral review of how Nepali users already transact online, centered on Facebook Marketplace and Hamrobazaar (top platforms in 2021).",
    findings:
      "Informed trust patterns, simplicity expectations, and single-pathway flows for digitally adverse audiences.",
  },
  {
    icon: Search,
    studyName: "Brand & Visual Market Research",
    methods:
      "Audience and trend analysis for Nepalese demography; testing logo, color, typography, and marketing materials for authority and warmth.",
    findings:
      "Produced market-tested brand identity, stylesheets, and pitch materials aligned to local trust and recognition.",
  },
  {
    icon: Quote,
    studyName: "Figma Prototype Usability Testing",
    methods:
      "Interactive prototype sessions with first-time users; task-based tests on form flows, transliteration, and video-guided help.",
    findings:
      "Surfaced friction points in step progression, terminology, and reassurance; validated romanized Nepali input and one-click legal consultation patterns.",
  },
];

const CIVIC_GOALS = [
  "Affordability: reduce documentation costs by 90%+ versus broker fees",
  "Accessibility: plain language, visual guidance, and flows for low digital literacy",
  "Equity: reach rural and semi-urban citizens, not only urban centers",
  "Trust & transparency: replace opaque broker systems with verified, fixed pricing",
  "Scalable B2B model: partner revenue to keep consumer forms sustainable",
];

export function ResearchSectionV2() {
  return (
    <section className="py-24 bg-white">
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
            <Search className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Research Foundation</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-xl text-gray-700 leading-relaxed mb-10"
          >
            Design decisions were grounded in named research studies below, not assumptions about
            how government forms should look online. The platform targeted citizens with low
            literacy and digital literacy who had been priced out of legal participation by a
            broker-driven black market.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6 mb-12"
          >
            {RESEARCH_STUDIES.map((study, index) => (
              <motion.article
                key={study.studyName}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * index, duration: 0.5 }}
                className="bg-gray-50 rounded-lg p-6 md:p-8 border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <study.icon className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                  <h3 className="text-xl font-bold text-primary">{study.studyName}</h3>
                </div>
                <dl className="grid md:grid-cols-2 gap-4 text-gray-700">
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wide text-primary mb-1">
                      Methods
                    </dt>
                    <dd className="leading-relaxed">{study.methods}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wide text-primary mb-1">
                      Findings used in product
                    </dt>
                    <dd className="leading-relaxed">{study.findings}</dd>
                  </div>
                </dl>
              </motion.article>
            ))}
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="relative bg-primary text-primary-foreground rounded-lg p-8 md:p-10 mb-12 border-l-4 border-secondary"
          >
            <Quote className="w-10 h-10 text-secondary mb-4 opacity-90" />
            <p className="text-xl md:text-2xl font-medium leading-relaxed italic">
              “Simplicity and ease of use were as vital as trust: people needed to feel good and
              taken care of when using something to build trust in the platform.”
            </p>
            <p className="mt-4 text-primary-foreground/80 text-sm">
              Core insight from User Research & Market Survey (2023) and usability testing
            </p>
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-gray-50 rounded-lg p-8 border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-primary mb-6">Strategic goals from research</h3>
            <ul className="space-y-3">
              {CIVIC_GOALS.map((goal) => (
                <li key={goal} className="flex items-start gap-3 text-lg text-gray-700">
                  <span className="text-secondary font-bold mt-0.5">•</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
