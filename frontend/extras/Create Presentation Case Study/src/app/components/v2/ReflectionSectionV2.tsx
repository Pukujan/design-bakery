import { motion } from "motion/react";
import { Sparkles, ExternalLink } from "lucide-react";

const SOURCES = [
  "Nepal Rastra Bank Survey 2022/23 (via Rising Nepal Daily, June 2025; OnlineKhabar, Feb 2024)",
  "National Census 2021 broadband data (via Digital Rights Nepal, 2022)",
  "Economic Survey 2022/23",
  "Nepal News (Nov 2025)",
  "Kathmandu Post",
  "My Republica",
  "Fiscal Nepal",
  "IT Entrepreneurs Community (Facebook, 2022)",
  "r/Nepal (Reddit, 2022)",
];

export function ReflectionSectionV2() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <Sparkles className="w-10 h-10 text-secondary" />
            <h2 className="text-4xl md:text-5xl font-bold">Reflection</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6 text-left md:text-center"
          >
            <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-primary-foreground/95">
              Ekagajpatra was an attempt to reduce broker dependency through better design. The
              platform reached users and earned recognition, but systemic broker capture persists, as
              documented by Nepal News in 2025. Civic-tech can improve individual experiences;
              institutional reform requires more than software.
            </p>

            <div className="w-24 h-1 bg-secondary mx-auto my-8" />

            <p className="text-xl leading-relaxed text-primary-foreground/90">
              Impactful design here was not about pixels alone. Research-driven flows, transparent
              pricing, and fullstack workflow architecture made complex government, legal, and
              financial documentation more accessible, affordable, and reliable at national scale, for
              those who could reach it. In a country where 31% digital literacy and 60% household
              internet absence remain the baseline, software alone cannot outrun infrastructure
              inequality.
            </p>

            <p className="text-sm text-primary-foreground/75 pt-4 leading-relaxed">
              <span className="font-semibold text-primary-foreground/90">Sources: </span>
              {SOURCES.join("; ")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 pt-12 border-t border-primary-foreground/20"
          >
            <a
              href="https://www.ekagajpatra.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-all duration-300 hover:scale-105 mb-8"
            >
              Visit Live Website
              <ExternalLink className="w-5 h-5" />
            </a>

            <p className="text-sm text-primary-foreground/70">
              Fullstack Product Engineering Case Study • Ekagajpatra • 2024
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
