import { motion } from "motion/react";
import { Palette, Layout, FileText } from "lucide-react";

export function ProductDesignOwnershipSection() {
  const focusAreas = [
    "Mapping offline documentation steps into digital flows",
    "Designing form progression and review states",
    "Reducing confusion through content hierarchy",
    "Creating reusable UI patterns",
    "Balancing simplicity with legal and financial accuracy",
    "Designing for both first-time users and professional repeat users"
  ];

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
            className="flex items-center gap-3 mb-12"
          >
            <Layout className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Product Design Ownership</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              My work included both <span className="font-semibold text-primary">interface design</span> and <span className="font-semibold text-primary">product logic</span>.
            </p>

            <p className="text-xl text-gray-700 leading-relaxed">
              I focused on designing flows that matched how real users approached documentation, especially users who were not highly technical or familiar with legal terminology.
            </p>

            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Palette className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">This included:</h3>
              </div>
              <ul className="space-y-4">
                {focusAreas.map((area, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{area}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-primary text-primary-foreground rounded-lg p-8 border-l-4 border-secondary">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-secondary flex-shrink-0" />
                <p className="text-xl leading-relaxed text-primary-foreground/95">
                  The strongest product decision was treating documentation as a <span className="font-semibold text-secondary">guided workflow</span>, not a static form.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
