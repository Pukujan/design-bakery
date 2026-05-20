import { motion } from "motion/react";
import { Users, Network } from "lucide-react";

export function CollaborationSection() {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
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
            className="flex items-center gap-3 mb-12"
          >
            <Users className="w-10 h-10 text-secondary" />
            <h2 className="text-4xl md:text-5xl font-bold">Collaboration and Ownership</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl leading-relaxed text-primary-foreground/95">
              I worked across <span className="font-semibold text-secondary">product, design, frontend, backend, and business requirements</span>.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-secondary/20">
              <div className="flex items-start gap-4 mb-6">
                <Network className="w-8 h-8 text-secondary flex-shrink-0" />
                <p className="text-xl leading-relaxed text-primary-foreground/95">
                  I collaborated with legal experts, backend engineers, stakeholders, and users to translate complex documentation processes into usable software.
                </p>
              </div>
            </div>

            <p className="text-xl leading-relaxed text-primary-foreground/95">
              My role required balancing <span className="font-semibold text-secondary">user experience, technical implementation, business sustainability, and regulatory/document accuracy</span>.
            </p>

            <div className="bg-secondary/20 rounded-lg p-8 border-l-4 border-secondary">
              <p className="text-xl leading-relaxed text-primary-foreground font-medium">
                This project strengthened my ability to work as an end-to-end product engineer, connecting design decisions directly to system architecture and operational outcomes.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
