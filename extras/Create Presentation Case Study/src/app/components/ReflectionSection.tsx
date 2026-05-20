import { motion } from "motion/react";
import { Sparkles, ExternalLink } from "lucide-react";

export function ReflectionSection() {
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
            className="space-y-6"
          >
            <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-primary-foreground/95">
              Ekagajpatra wasn't just a digital platform — it was a movement toward civic equity.
            </p>

            <div className="w-24 h-1 bg-secondary mx-auto my-8" />

            <p className="text-xl leading-relaxed text-primary-foreground/90">
              It taught me that impactful design isn't about pixels or patterns; it's about redesigning access, trust, and dignity for people who were left out of the system.
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
              Case Study • Ekagajpatra • 2024
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}